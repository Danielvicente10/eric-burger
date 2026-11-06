import { BadRequestException, Injectable } from '@nestjs/common';
import type { EnderecoDto } from '../dto/criar-pedido.dto.js';
import { GeocodificacaoService } from './geocodificacao.service.js';

// Coordenadas da loja, obtidas uma vez pela mesma fonte usada nos
// endereços dos clientes (consulta de CEP) — assim o ponto de referência e
// os pontos medidos vêm da mesma base, sem viés entre fontes diferentes.
// Ponto fixo: só muda se a loja mudar de endereço. Exportado só pra os
// testes conseguirem gerar pontos a uma distância exata daqui.
//
// TODO (antes de ligar a entrega): trocar pelas coordenadas do endereço
// real da Eric Burger. Os valores abaixo são os da pastelaria de
// Capivari, herdados da cópia do projeto — com eles a taxa sai errada.
export const COORDENADAS_LOJA = { lat: -23.00124, lon: -47.51762 };

// Faixas de distância (raio em linha reta a partir da loja) → taxa de
// entrega. TODO: confirmar a tabela de taxas com a Eric Burger. Ordenadas da mais próxima pra mais longe: a primeira faixa cujo
// "ateKm" cobre a distância calculada é a que vale. Acima da última faixa,
// não entregamos (ver FreteService.calcular).
const FAIXAS_ENTREGA = [
  { ateKm: 4, taxaCentavos: 800 },
  { ateKm: 5, taxaCentavos: 1000 },
  { ateKm: 6, taxaCentavos: 1300 },
  { ateKm: 7, taxaCentavos: 1600 },
  { ateKm: 8, taxaCentavos: 1900 },
  { ateKm: 9, taxaCentavos: 2000 },
  { ateKm: 10, taxaCentavos: 2300 },
];

export interface ResultadoFrete {
  distanciaKm: number;
  taxaEntregaCentavos: number;
}

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

// Distância em linha reta entre duas coordenadas (fórmula de haversine).
// Não é distância de rota/trajeto — é o "raio" mesmo, como pedido.
function distanciaKmEntre(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const RAIO_TERRA_KM = 6371;
  const dLat = paraRadianos(b.lat - a.lat);
  const dLon = paraRadianos(b.lon - a.lon);
  const lat1 = paraRadianos(a.lat);
  const lat2 = paraRadianos(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

// TODO: cidade da Eric Burger. Todo endereço de entrega é tratado como
// sendo da mesma cidade (não faz sentido entregar em outra cidade dentro
// de um raio de 10km, mas se algum dia isso mudar, dá pra receber
// cidade/estado no próprio EnderecoDto em vez de fixar aqui).
const CIDADE_LOJA = 'Capivari';
const ESTADO_LOJA = 'Sao Paulo';

@Injectable()
export class FreteService {
  constructor(private readonly geocodificacao: GeocodificacaoService) {}

  async calcular(endereco: EnderecoDto): Promise<ResultadoFrete> {
    const coordenadasCliente = await this.geocodificacao.geocodificar({
      cep: endereco.cep,
      rua: endereco.rua,
      numero: endereco.numero,
      cidade: CIDADE_LOJA,
      estado: ESTADO_LOJA,
    });

    if (!coordenadasCliente) {
      throw new BadRequestException(
        'Não conseguimos localizar esse endereço pra calcular a entrega. Preencha o CEP — é por ele que encontramos o endereço.',
      );
    }

    const distanciaKm = Math.round(distanciaKmEntre(COORDENADAS_LOJA, coordenadasCliente) * 10) / 10;
    const faixa = FAIXAS_ENTREGA.find((f) => distanciaKm <= f.ateKm);

    if (!faixa) {
      const limiteKm = FAIXAS_ENTREGA[FAIXAS_ENTREGA.length - 1].ateKm;
      throw new BadRequestException(
        `Esse endereço está a ${distanciaKm.toFixed(1)}km da loja — fora da nossa área de entrega (até ${limiteKm}km).`,
      );
    }

    return { distanciaKm, taxaEntregaCentavos: faixa.taxaCentavos };
  }
}
