import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Coordenadas {
  lat: number;
  lon: number;
}

// Separa os dois jeitos de a consulta de CEP "não dar certo", porque eles
// pedem tratamento oposto: 'sem-coordenadas' é resposta legítima (o CEP
// existe, a base é que não tem o ponto) e permite tentar a reserva;
// 'falha-tecnica' é a consulta não ter acontecido, e aí não dá pra confiar
// em nada — ver o comentário do GeocodificacaoService.
type ResultadoConsultaCep =
  | { situacao: 'ok'; coordenadas: Coordenadas }
  | { situacao: 'sem-coordenadas' }
  | { situacao: 'falha-tecnica'; motivo: string };

export interface EnderecoParaGeocodificar {
  cep?: string;
  rua: string;
  numero: string;
  cidade: string;
  estado: string;
}

// Identifica a aplicação nas chamadas ao Nominatim — exigido pela política
// de uso deles (https://operations.osmfoundation.org/policies/nominatim/),
// que também limita a 1 requisição/segundo por aplicação.
const USER_AGENT = 'EricBurger-Backend/1.0 (sistema de pedidos, calculo de frete)';

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function montarDescricao(endereco: EnderecoParaGeocodificar): string {
  return `${endereco.rua}, ${endereco.numero} - ${endereco.cidade}/${endereco.estado}`;
}

/**
 * Transforma um endereço em coordenadas, pro cálculo da taxa de entrega.
 * Não guarda nada e não valida o endereço contra base oficial nenhuma.
 *
 * Duas fontes, nessa ordem:
 *
 * 1. CEP via AwesomeAPI (base dos Correios). É a fonte principal porque
 *    resolve o problema que inviabilizou usar mapa aqui: ruas de cidades
 *    pequenas frequentemente NÃO existem no OpenStreetMap (a Rua Jácomo
 *    Schincariol, em Capivari, é um caso real que testamos — o OSM não tem,
 *    o CEP tem). A precisão é por rua, não por número da casa: CEPs
 *    diferentes da mesma via costumam devolver a mesma coordenada. Pra
 *    faixas de 3 a 10km isso é aceitável.
 *
 * 2. Nominatim (OpenStreetMap) por nome de rua — reserva pra quando o
 *    cliente não informa o CEP, ou quando o CEP existe mas não tem
 *    coordenada na base. Busca ESTRUTURADA (street/city/state/country
 *    separados) em vez de frase única: assim, quando o número da casa não
 *    bate, ainda acha a rua em vez de não achar nada.
 *
 * A reserva NÃO cobre falha técnica da consulta de CEP (fora do ar, cota
 * estourada, rede). O motivo é concreto: quem chama passa sempre a cidade
 * da loja, então o Nominatim procura a rua DENTRO de Capivari. Se o
 * cliente é de outra cidade e existe uma rua de mesmo nome em Capivari, a
 * busca "acha" o endereço errado e o pedido sai com frete mais barato do
 * que devia, sem erro nenhum aparecer. Aconteceu de verdade: com a
 * AwesomeAPI devolvendo 429, um endereço de Rafard virou uma rua homônima
 * em Capivari e foi cobrado como 1,8km. Preço errado em silêncio é pior
 * que erro na tela, então nesse caso a gente falha e pede pra tentar de
 * novo.
 */
@Injectable()
export class GeocodificacaoService {
  private readonly logger = new Logger(GeocodificacaoService.name);
  // Opcional. Sem chave a API funciona, mas é a chave (gratuita) que
  // garante a cota de 100 mil consultas/mês.
  private readonly awesomeApiToken?: string;

  constructor(config: ConfigService) {
    this.awesomeApiToken = config.get<string>('AWESOMEAPI_TOKEN') || undefined;
  }

  async geocodificar(endereco: EnderecoParaGeocodificar): Promise<Coordenadas | null> {
    const cep = endereco.cep ? somenteDigitos(endereco.cep) : '';

    if (cep.length === 8) {
      const porCep = await this.geocodificarPorCep(cep);

      if (porCep.situacao === 'ok') return porCep.coordenadas;

      if (porCep.situacao === 'falha-tecnica') {
        this.logger.error(`Consulta de CEP indisponível (${porCep.motivo}) — recusando o cálculo.`);
        throw new ServiceUnavailableException(
          'Não conseguimos calcular a entrega agora — a consulta de CEP está indisponível. Tente de novo em alguns instantes.',
        );
      }

      this.logger.warn(`CEP ${cep} não tem coordenada na base — tentando por nome de rua.`);
    }

    return this.geocodificarPorNomeDeRua(endereco);
  }

  private async geocodificarPorCep(cep: string): Promise<ResultadoConsultaCep> {
    const url = new URL(`https://cep.awesomeapi.com.br/json/${cep}`);
    if (this.awesomeApiToken) {
      url.searchParams.set('token', this.awesomeApiToken);
    }

    try {
      const resposta = await fetch(url);
      if (!resposta.ok) {
        // 429 sem token é o caso mais comum em hospedagem compartilhada: a
        // cota da AwesomeAPI é por IP, e o IP de saída do servidor é
        // dividido com outros serviços. Configurar AWESOMEAPI_TOKEN passa a
        // contagem pra chave (100 mil/mês) em vez do IP.
        this.logger.warn(`AwesomeAPI retornou HTTP ${resposta.status} para o CEP ${cep}`);
        return { situacao: 'falha-tecnica', motivo: `HTTP ${resposta.status}` };
      }

      const corpo = (await resposta.json()) as { lat?: string; lng?: string };
      if (!corpo.lat || !corpo.lng) return { situacao: 'sem-coordenadas' };

      const lat = Number(corpo.lat);
      const lon = Number(corpo.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { situacao: 'sem-coordenadas' };

      return { situacao: 'ok', coordenadas: { lat, lon } };
    } catch (erro) {
      const motivo = (erro as Error).message;
      this.logger.warn(`Falha ao consultar o CEP ${cep}: ${motivo}`);
      return { situacao: 'falha-tecnica', motivo };
    }
  }

  private async geocodificarPorNomeDeRua(
    endereco: EnderecoParaGeocodificar,
  ): Promise<Coordenadas | null> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('street', `${endereco.rua}, ${endereco.numero}`);
    url.searchParams.set('city', endereco.cidade);
    url.searchParams.set('state', endereco.estado);
    url.searchParams.set('country', 'Brasil');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');

    const descricao = montarDescricao(endereco);

    try {
      const resposta = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!resposta.ok) {
        this.logger.warn(`Nominatim retornou ${resposta.status} para "${descricao}"`);
        return null;
      }

      const resultados = (await resposta.json()) as Array<{ lat: string; lon: string }>;
      if (!resultados.length) return null;

      return { lat: Number(resultados[0].lat), lon: Number(resultados[0].lon) };
    } catch (erro) {
      this.logger.warn(`Falha ao geocodificar "${descricao}" no Nominatim: ${(erro as Error).message}`);
      return null;
    }
  }
}
