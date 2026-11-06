import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { COORDENADAS_LOJA, FreteService } from './frete.service.js';
import { GeocodificacaoService } from './geocodificacao.service.js';

// 1 grau de latitude ≈ 111.19km (mesma constante usada na fórmula de
// haversine do serviço). Deslocar só a latitude, mantendo a longitude
// igual à da loja, dá uma distância norte-sul exata e previsível — assim
// os testes não dependem de geocodificação de verdade (rede, Nominatim).
const KM_POR_GRAU_LATITUDE = (6371 * Math.PI) / 180;

function pontoADistanciaKm(km: number) {
  return {
    lat: COORDENADAS_LOJA.lat + km / KM_POR_GRAU_LATITUDE,
    lon: COORDENADAS_LOJA.lon,
  };
}

const ENDERECO_QUALQUER = { rua: 'Rua Teste', numero: '1', bairro: 'Bairro Teste' };

describe('FreteService', () => {
  let service: FreteService;
  let geocodificar: jest.Mock;

  beforeEach(async () => {
    geocodificar = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FreteService,
        { provide: GeocodificacaoService, useValue: { geocodificar } },
      ],
    }).compile();
    service = moduleRef.get(FreteService);
  });

  // Cada faixa é testada no limite exato e logo depois dele — é onde o erro
  // de "<" no lugar de "<=" apareceria, cobrando a mais de quem está bem na
  // fronteira.
  it.each([
    [0, 800],
    [3.9, 800],
    [4.0, 800],
    [4.1, 1000],
    [5.0, 1000],
    [5.1, 1300],
    [6.0, 1300],
    [6.1, 1600],
    [7.0, 1600],
    [7.1, 1900],
    [8.0, 1900],
    [8.1, 2000],
    [9.0, 2000],
    [9.1, 2300],
    [10.0, 2300],
  ])('cobra %ikm como %i centavos', async (km, taxaEsperadaCentavos) => {
    geocodificar.mockResolvedValue(pontoADistanciaKm(km));
    const resultado = await service.calcular(ENDERECO_QUALQUER);
    expect(resultado.taxaEntregaCentavos).toBe(taxaEsperadaCentavos);
  });

  it('rejeita endereço a mais de 10km da loja', async () => {
    geocodificar.mockResolvedValue(pontoADistanciaKm(10.1));
    await expect(service.calcular(ENDERECO_QUALQUER)).rejects.toThrow(BadRequestException);
  });

  it('rejeita quando o endereço não é encontrado pela geocodificação', async () => {
    geocodificar.mockResolvedValue(null);
    await expect(service.calcular(ENDERECO_QUALQUER)).rejects.toThrow(BadRequestException);
  });
});
