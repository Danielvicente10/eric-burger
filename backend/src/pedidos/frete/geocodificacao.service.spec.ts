import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodificacaoService } from './geocodificacao.service.js';

// O endereço é sempre o mesmo nos testes: o que muda é o que as APIs
// externas respondem.
const ENDERECO = {
  cep: '13363-274',
  rua: 'Rua Jacomo Schincariol',
  numero: '240',
  cidade: 'Capivari',
  estado: 'Sao Paulo',
};

function criarServico(token?: string): GeocodificacaoService {
  const config = { get: () => token } as unknown as ConfigService;
  return new GeocodificacaoService(config);
}

function respostaJson(corpo: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(corpo),
  } as unknown as Response;
}

describe('GeocodificacaoService', () => {
  let fetchOriginal: typeof globalThis.fetch;

  beforeEach(() => {
    fetchOriginal = globalThis.fetch;
    // Silencia os logger.warn/error do serviço pra não poluir a saída.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it('usa as coordenadas do CEP quando a consulta responde', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(respostaJson({ lat: '-22.98518', lng: '-47.51114' }));

    const coordenadas = await criarServico().geocodificar(ENDERECO);

    expect(coordenadas).toEqual({ lat: -22.98518, lon: -47.51114 });
    // Só a consulta de CEP: não deve sobrar chamada pro Nominatim.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  // Este é o teste que importa: com a consulta de CEP fora do ar, a busca
  // por nome de rua procuraria dentro da cidade da loja e poderia casar
  // com uma rua homônima de outra cidade, cobrando frete a menos sem
  // sinalizar nada. Tem que falhar, não improvisar.
  it('recusa o cálculo quando a consulta de CEP falha por cota estourada (429)', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(respostaJson({}, false, 429));

    await expect(criarServico().geocodificar(ENDERECO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('recusa o cálculo quando a consulta de CEP cai na rede', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET'));

    await expect(criarServico().geocodificar(ENDERECO)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('cai pro nome da rua quando o CEP responde mas não tem coordenada', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(respostaJson({ city: 'Capivari' })) // sem lat/lng
      .mockResolvedValueOnce(respostaJson([{ lat: '-22.9', lon: '-47.5' }]));

    const coordenadas = await criarServico().geocodificar(ENDERECO);

    expect(coordenadas).toEqual({ lat: -22.9, lon: -47.5 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('vai direto pro nome da rua quando não veio CEP', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(respostaJson([{ lat: '-22.9', lon: '-47.5' }]));

    const coordenadas = await criarServico().geocodificar({ ...ENDERECO, cep: undefined });

    expect(coordenadas).toEqual({ lat: -22.9, lon: -47.5 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('devolve null quando nenhuma das duas fontes acha o endereço', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(respostaJson({ city: 'Capivari' })) // sem lat/lng
      .mockResolvedValueOnce(respostaJson([])); // Nominatim sem resultado

    await expect(criarServico().geocodificar(ENDERECO)).resolves.toBeNull();
  });

  it('manda o token na consulta de CEP quando ele está configurado', async () => {
    const fetchFalso = jest
      .fn()
      .mockResolvedValue(respostaJson({ lat: '-22.98518', lng: '-47.51114' }));
    globalThis.fetch = fetchFalso;

    await criarServico('chave-de-teste').geocodificar(ENDERECO);

    const url = fetchFalso.mock.calls[0][0] as URL;
    expect(url.searchParams.get('token')).toBe('chave-de-teste');
  });
});
