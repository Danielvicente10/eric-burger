import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ADICIONAIS,
  ITENS,
  TIPOS_ADICIONAL,
  type AdicionalCardapio,
  type ItemCardapio,
} from './cardapio.data.js';

export interface AcrescimoCalculado {
  id: string;
  nome: string;
  precoCentavos: number;
}

export interface ItemCalculado {
  itemCardapioId: string;
  itemNome: string;
  varianteId?: string;
  varianteNome?: string;
  precoUnitarioCentavos: number;
  acrescimos: AcrescimoCalculado[];
  observacao?: string;
  quantidade: number;
  subtotalCentavos: number;
}

// Fonte da verdade dos preços no backend. Espelha o que hoje é feito no
// front em src/components/ModalProduto.jsx e src/utils/pedido.js, mas nunca
// confia em nenhum preço vindo do cliente — só em itemCardapioId,
// varianteId, quantidade, acrescimosIds e observacao (texto livre).
@Injectable()
export class CardapioService {
  private obterItem(itemCardapioId: string): ItemCardapio {
    const item = ITENS.find((i) => i.id === itemCardapioId);
    if (!item) {
      throw new BadRequestException(
        `Item de cardápio desconhecido: "${itemCardapioId}"`,
      );
    }
    return item;
  }

  private obterAdicional(adicionalId: string): AdicionalCardapio {
    const adicional = ADICIONAIS.find((a) => a.id === adicionalId);
    if (!adicional) {
      throw new BadRequestException(`Acréscimo desconhecido: "${adicionalId}"`);
    }
    return adicional;
  }

  /** Resolve o preço base do item: ou vem direto dele, ou de uma das variantes (ex: sabor da bebida, refri do combo). */
  private resolverPrecoBase(
    item: ItemCardapio,
    varianteId?: string,
  ): { precoBaseCentavos: number; varianteNome?: string } {
    if (item.variantes && item.variantes.length > 0) {
      if (!varianteId) {
        throw new BadRequestException(
          `O item "${item.nome}" exige escolher uma variante`,
        );
      }
      const variante = item.variantes.find((v) => v.id === varianteId);
      if (!variante) {
        throw new BadRequestException(
          `Variante desconhecida "${varianteId}" para o item "${item.nome}"`,
        );
      }
      return {
        precoBaseCentavos: variante.precoCentavos,
        varianteNome: variante.nome,
      };
    }

    if (varianteId) {
      throw new BadRequestException(`O item "${item.nome}" não tem variantes`);
    }
    if (typeof item.precoCentavos !== 'number') {
      // Não deveria acontecer com os dados atuais, mas protege contra item mal cadastrado.
      throw new BadRequestException(
        `Item "${item.nome}" está sem preço configurado`,
      );
    }
    return { precoBaseCentavos: item.precoCentavos };
  }

  /** Recalcula o preço de um item do pedido a partir só dos ids/quantidade/observação informados. */
  calcularItem(input: {
    itemCardapioId: string;
    varianteId?: string;
    quantidade: number;
    acrescimosIds: string[];
    observacao?: string;
  }): ItemCalculado {
    const item = this.obterItem(input.itemCardapioId);
    const { precoBaseCentavos, varianteNome } = this.resolverPrecoBase(
      item,
      input.varianteId,
    );

    if (input.acrescimosIds.length > 0 && !item.permiteAcrescimo) {
      throw new BadRequestException(
        `O item "${item.nome}" não aceita acréscimos`,
      );
    }

    // Cada item aceita só os acréscimos dos tipos dele: o bacon de lanche
    // (R$ 5) não pode ir numa batata grande, cujo bacon custa R$ 8.
    const adicionais = input.acrescimosIds.map((id) => this.obterAdicional(id));
    for (const a of adicionais) {
      if (!item.adicionais.includes(a.tipo)) {
        throw new BadRequestException(
          `O acréscimo "${a.nome}" (${a.id}) não vale para o item "${item.nome}"`,
        );
      }
    }
    if (new Set(input.acrescimosIds).size !== input.acrescimosIds.length) {
      throw new BadRequestException(
        `Acréscimo repetido no item "${item.nome}"`,
      );
    }
    for (const tipo of TIPOS_ADICIONAL.filter((t) => t.exclusivo)) {
      const doTipo = adicionais.filter((a) => a.tipo === tipo.id);
      if (doTipo.length > 1) {
        throw new BadRequestException(
          `Escolha só uma opção de "${tipo.titulo}" no item "${item.nome}"`,
        );
      }
    }

    const acrescimos: AcrescimoCalculado[] = adicionais.map((a) => ({
      id: a.id,
      nome: a.nome,
      precoCentavos: a.precoCentavos,
    }));

    const precoAcrescimosCentavos = acrescimos.reduce(
      (soma, a) => soma + a.precoCentavos,
      0,
    );
    const precoUnitarioCentavos = precoBaseCentavos + precoAcrescimosCentavos;

    return {
      itemCardapioId: item.id,
      itemNome: item.nome,
      varianteId: input.varianteId,
      varianteNome,
      precoUnitarioCentavos,
      acrescimos,
      observacao: input.observacao?.trim() || undefined,
      quantidade: input.quantidade,
      subtotalCentavos: precoUnitarioCentavos * input.quantidade,
    };
  }

  calcularTotal(itens: ItemCalculado[]): number {
    return itens.reduce((soma, item) => soma + item.subtotalCentavos, 0);
  }
}
