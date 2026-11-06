import { inicioDoDiaNoBrasil, montarCodigoPedido } from './codigo-pedido.util.js';

describe('montarCodigoPedido', () => {
  it('começa com a sequência do dia seguida de hífen', () => {
    expect(montarCodigoPedido(12)).toMatch(/^12-/);
    expect(montarCodigoPedido(1)).toMatch(/^1-/);
    expect(montarCodigoPedido(137)).toMatch(/^137-/);
  });

  it('gera um sufixo de 3 caracteres, sem os que confundem na leitura', () => {
    for (let i = 0; i < 200; i++) {
      const sufixo = montarCodigoPedido(1).split('-')[1];
      expect(sufixo).toHaveLength(3);
      // O, 0, I, 1 e L ficam de fora justamente pra não confundir no cupom.
      expect(sufixo).not.toMatch(/[O0I1L]/);
    }
  });

  it('é bem mais curto que o formato antigo (PI-0508-2144-52)', () => {
    expect(montarCodigoPedido(12).length).toBeLessThan('PI-0508-2144-52'.length);
  });

  it('não repete o código para a mesma sequência (é o sufixo que protege)', () => {
    const codigos = new Set(
      Array.from({ length: 300 }, () => montarCodigoPedido(12)),
    );
    // 31^3 = 29.791 combinações: 300 sorteios não deveriam colidir quase nunca.
    expect(codigos.size).toBeGreaterThan(290);
  });
});

describe('inicioDoDiaNoBrasil', () => {
  it('usa a meia-noite de São Paulo, não a do servidor em UTC', () => {
    // 02:00 UTC de 13/08 ainda é 23:00 de 12/08 em São Paulo — o dia
    // "brasileiro" que vale aqui é o 12, não o 13.
    const inicio = inicioDoDiaNoBrasil(new Date('2026-08-13T02:00:00Z'));
    expect(inicio.toISOString()).toBe('2026-08-12T03:00:00.000Z');
  });

  it('vira o dia às 00:00 de São Paulo (03:00 UTC)', () => {
    const antes = inicioDoDiaNoBrasil(new Date('2026-08-13T02:59:59Z'));
    const depois = inicioDoDiaNoBrasil(new Date('2026-08-13T03:00:01Z'));
    expect(antes.toISOString()).toBe('2026-08-12T03:00:00.000Z');
    expect(depois.toISOString()).toBe('2026-08-13T03:00:00.000Z');
  });

  it('não zera a contagem no meio do movimento da noite', () => {
    // 21:30 em São Paulo (00:30 UTC do dia seguinte) — horário de pico da
    // pastelaria. Tem que continuar contando como o mesmo dia.
    const jantar = inicioDoDiaNoBrasil(new Date('2026-08-13T00:30:00Z'));
    const tarde = inicioDoDiaNoBrasil(new Date('2026-08-12T18:00:00Z'));
    expect(jantar.toISOString()).toBe(tarde.toISOString());
  });
});
