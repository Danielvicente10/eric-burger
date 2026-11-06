-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('RETIRADA', 'ENTREGA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('RECEBIDO', 'IMPRESSO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE');

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "telefone" TEXT,
    "tipoEntrega" "TipoEntrega" NOT NULL,
    "endereco" JSONB,
    "pagamento" TEXT NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'RECEBIDO',
    "totalCentavos" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "impressoEm" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "itemCardapioId" TEXT NOT NULL,
    "itemNome" TEXT NOT NULL,
    "varianteId" TEXT,
    "varianteNome" TEXT,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "acrescimos" JSONB NOT NULL,
    "observacao" TEXT,
    "quantidade" INTEGER NOT NULL,
    "subtotalCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE INDEX "Pedido_status_criadoEm_idx" ON "Pedido"("status", "criadoEm");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
