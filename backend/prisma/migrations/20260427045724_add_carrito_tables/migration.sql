/*
  Warnings:

  - The primary key for the `cli_items_lista_deseos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[lista_deseo_id,producto_id]` on the table `cli_items_lista_deseos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cli_items_lista_deseos" DROP CONSTRAINT "cli_items_lista_deseos_pkey";

-- CreateTable
CREATE TABLE "ord_carritos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_carrito" (
    "id" SERIAL NOT NULL,
    "carrito_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "fecha_agregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_items_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ord_items_carrito_carrito_id_producto_id_key" ON "ord_items_carrito"("carrito_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_items_lista_deseos_lista_deseo_id_producto_id_key" ON "cli_items_lista_deseos"("lista_deseo_id", "producto_id");

-- AddForeignKey
ALTER TABLE "ord_carritos" ADD CONSTRAINT "ord_carritos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "ord_carritos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
