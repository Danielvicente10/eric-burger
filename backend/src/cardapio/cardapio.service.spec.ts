import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ADICIONAIS, ITENS, TIPOS_ADICIONAL } from './cardapio.data.js';
import { CardapioService } from './cardapio.service.js';

// Estes testes existem pra garantir que o recálculo de preço no backend
// NUNCA diverge do que o front (ModalProduto.jsx / utils/pedido.js) mostra
// pro cliente. Usamos os próprios ids do cardápio real em vez de valores
// fixos, pra não quebrar se um preço mudar — só checamos a matemática.
describe('CardapioService', () => {
  let service: CardapioService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CardapioService],
    }).compile();
    service = moduleRef.get(CardapioService);
  });

  it('calcula o preço de um item simples (sem variante, sem acréscimo)', () => {
    const item = ITENS.find((i) => !i.variantes && i.precoCentavos)!;
    const calculado = service.calcularItem({
      itemCardapioId: item.id,
      quantidade: 1,
      acrescimosIds: [],
    });
    expect(calculado.precoUnitarioCentavos).toBe(item.precoCentavos);
    expect(calculado.subtotalCentavos).toBe(item.precoCentavos);
  });

  it('multiplica corretamente pela quantidade', () => {
    const item = ITENS.find((i) => !i.variantes && i.precoCentavos)!;
    const calculado = service.calcularItem({
      itemCardapioId: item.id,
      quantidade: 3,
      acrescimosIds: [],
    });
    expect(calculado.subtotalCentavos).toBe(item.precoCentavos! * 3);
  });

  it('soma acréscimos ao preço unitário, quando o item permite', () => {
    const item = ITENS.find(
      (i) => i.adicionais.includes('lanche') && !i.variantes && i.precoCentavos,
    )!;
    const [a1, a2] = ADICIONAIS.filter((a) => a.tipo === 'lanche');
    const calculado = service.calcularItem({
      itemCardapioId: item.id,
      quantidade: 2,
      acrescimosIds: [a1.id, a2.id],
    });
    const precoUnitarioEsperado =
      item.precoCentavos! + a1.precoCentavos + a2.precoCentavos;
    expect(calculado.precoUnitarioCentavos).toBe(precoUnitarioEsperado);
    expect(calculado.subtotalCentavos).toBe(precoUnitarioEsperado * 2);
  });

  it('rejeita acréscimo em item que não permite (ex: bebidas)', () => {
    const item = ITENS.find((i) => !i.permiteAcrescimo)!;
    const [a1] = ADICIONAIS;
    expect(() =>
      service.calcularItem({
        itemCardapioId: item.id,
        quantidade: 1,
        acrescimosIds: [a1.id],
      }),
    ).toThrow(BadRequestException);
  });

  it('usa o preço da variante escolhida', () => {
    const item = ITENS.find((i) => i.variantes && i.variantes.length >= 2)!;
    const [v1, v2] = item.variantes!;

    const comV1 = service.calcularItem({
      itemCardapioId: item.id,
      varianteId: v1.id,
      quantidade: 1,
      acrescimosIds: [],
    });
    const comV2 = service.calcularItem({
      itemCardapioId: item.id,
      varianteId: v2.id,
      quantidade: 1,
      acrescimosIds: [],
    });

    expect(comV1.precoUnitarioCentavos).toBe(v1.precoCentavos);
    expect(comV2.precoUnitarioCentavos).toBe(v2.precoCentavos);
  });

  it('rejeita item com variantes se nenhuma variante for informada', () => {
    const item = ITENS.find((i) => i.variantes && i.variantes.length > 0)!;
    expect(() =>
      service.calcularItem({
        itemCardapioId: item.id,
        quantidade: 1,
        acrescimosIds: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita varianteId em item que não tem variantes', () => {
    const item = ITENS.find((i) => !i.variantes)!;
    expect(() =>
      service.calcularItem({
        itemCardapioId: item.id,
        varianteId: 'qualquer',
        quantidade: 1,
        acrescimosIds: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita um itemCardapioId inexistente', () => {
    expect(() =>
      service.calcularItem({
        itemCardapioId: 'nao-existe',
        quantidade: 1,
        acrescimosIds: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita um acréscimo inexistente', () => {
    const item = ITENS.find((i) => i.permiteAcrescimo && !i.variantes)!;
    expect(() =>
      service.calcularItem({
        itemCardapioId: item.id,
        quantidade: 1,
        acrescimosIds: ['nao-existe'],
      }),
    ).toThrow(BadRequestException);
  });

  it('mantém a observação (texto livre do cliente) sem afetar o preço', () => {
    const item = ITENS.find((i) => !i.variantes && i.precoCentavos)!;
    const calculado = service.calcularItem({
      itemCardapioId: item.id,
      quantidade: 1,
      acrescimosIds: [],
      observacao: '  sem cebola  ',
    });
    expect(calculado.observacao).toBe('sem cebola');
    expect(calculado.precoUnitarioCentavos).toBe(item.precoCentavos);
  });

  it('soma corretamente o total de vários itens', () => {
    const item1 = ITENS.find((i) => !i.variantes && i.precoCentavos)!;
    const item2 = ITENS.filter((i) => !i.variantes && i.precoCentavos)[1];
    const calc1 = service.calcularItem({
      itemCardapioId: item1.id,
      quantidade: 1,
      acrescimosIds: [],
    });
    const calc2 = service.calcularItem({
      itemCardapioId: item2.id,
      quantidade: 2,
      acrescimosIds: [],
    });
    expect(service.calcularTotal([calc1, calc2])).toBe(
      calc1.subtotalCentavos + calc2.subtotalCentavos,
    );
  });

  it('rejeita acréscimo de outro tipo (bacon de lanche numa batata grande)', () => {
    const batata = ITENS.find((i) => i.adicionais.includes('batata-grande'))!;
    const baconLanche = ADICIONAIS.find((a) => a.tipo === 'lanche')!;
    expect(() =>
      service.calcularItem({
        itemCardapioId: batata.id,
        quantidade: 1,
        acrescimosIds: [baconLanche.id],
      }),
    ).toThrow(BadRequestException);
  });

  it('aceita uma troca de hambúrguer, mas recusa duas no mesmo item', () => {
    const tipoTroca = TIPOS_ADICIONAL.find((t) => t.exclusivo)!;
    const lanche = ITENS.find(
      (i) => i.adicionais.includes(tipoTroca.id) && !i.variantes,
    )!;
    const [t1, t2] = ADICIONAIS.filter((a) => a.tipo === tipoTroca.id);

    const comUma = service.calcularItem({
      itemCardapioId: lanche.id,
      quantidade: 1,
      acrescimosIds: [t1.id],
    });
    expect(comUma.precoUnitarioCentavos).toBe(
      lanche.precoCentavos! + t1.precoCentavos,
    );

    expect(() =>
      service.calcularItem({
        itemCardapioId: lanche.id,
        quantidade: 1,
        acrescimosIds: [t1.id, t2.id],
      }),
    ).toThrow(BadRequestException);
  });
});
