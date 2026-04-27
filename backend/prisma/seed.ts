// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type ProductoSeed = {
  sku: string;
  nombre: string;
  categoriaId: number;
  precioCosto: number;
  precioVenta: number;
  descripcion: string;
  stockFisico: number;
  imagen: string;
};

async function main() {
  console.log('🟢 Ejecutando Seed de datos iniciales...');
  
  // 1. Crear Roles
  const rolAdmin = await prisma.segRol.upsert({
    where: { nombre: 'Administrador' }, 
    update: {}, 
    create: { nombre: 'Administrador', descripcion: 'Acceso total' }
  });
  const rolCliente = await prisma.segRol.upsert({
    where: { nombre: 'Cliente' }, 
    update: {}, 
    create: { nombre: 'Cliente', descripcion: 'Acceso tienda' }
  });
  const rolGerenteVentas = await prisma.segRol.upsert({
    where: { nombre: 'Gerente Ventas' },
    update: {},
    create: { nombre: 'Gerente Ventas', descripcion: 'Gestión comercial y reportes' }
  });
  const rolGerenteInventario = await prisma.segRol.upsert({
    where: { nombre: 'Gerente Inventario' },
    update: {},
    create: { nombre: 'Gerente Inventario', descripcion: 'Gestión de inventario y compras' }
  });

  // 2. Crear Usuarios de Prueba
  const adminPasswordHash = await bcrypt.hash('Admin123456!', 12);
  const clientePasswordHash = await bcrypt.hash('Cliente123456!', 12);
  const ventasPasswordHash = await bcrypt.hash('Ventas123456!', 12);
  const inventarioPasswordHash = await bcrypt.hash('Inventario123456!', 12);

  const adminUser = await prisma.segUsuario.upsert({
    where: { email: 'admin@stockflow.test' },
    update: {
      nombreCompleto: 'Administrador Demo',
      passwordHash: adminPasswordHash,
      activo: true,
    },
    create: {
      email: 'admin@stockflow.test',
      nombreCompleto: 'Administrador Demo',
      passwordHash: adminPasswordHash,
      activo: true,
    }
  });

  const clienteUser = await prisma.segUsuario.upsert({
    where: { email: 'cliente@stockflow.test' },
    update: {
      nombreCompleto: 'Cliente Demo',
      passwordHash: clientePasswordHash,
      activo: true,
    },
    create: {
      email: 'cliente@stockflow.test',
      nombreCompleto: 'Cliente Demo',
      passwordHash: clientePasswordHash,
      activo: true,
    }
  });

  const ventasUser = await prisma.segUsuario.upsert({
    where: { email: 'ventas@stockflow.test' },
    update: {
      nombreCompleto: 'Gerente de Ventas Demo',
      passwordHash: ventasPasswordHash,
      activo: true,
    },
    create: {
      email: 'ventas@stockflow.test',
      nombreCompleto: 'Gerente de Ventas Demo',
      passwordHash: ventasPasswordHash,
      activo: true,
    }
  });

  const inventarioUser = await prisma.segUsuario.upsert({
    where: { email: 'inventario@stockflow.test' },
    update: {
      nombreCompleto: 'Gerente de Inventario Demo',
      passwordHash: inventarioPasswordHash,
      activo: true,
    },
    create: {
      email: 'inventario@stockflow.test',
      nombreCompleto: 'Gerente de Inventario Demo',
      passwordHash: inventarioPasswordHash,
      activo: true,
    }
  });

  await prisma.segUsuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: adminUser.id, rolId: rolAdmin.id } },
    update: {},
    create: { usuarioId: adminUser.id, rolId: rolAdmin.id },
  });
  await prisma.segUsuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: clienteUser.id, rolId: rolCliente.id } },
    update: {},
    create: { usuarioId: clienteUser.id, rolId: rolCliente.id },
  });
  await prisma.segUsuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: ventasUser.id, rolId: rolGerenteVentas.id } },
    update: {},
    create: { usuarioId: ventasUser.id, rolId: rolGerenteVentas.id },
  });
  await prisma.segUsuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: inventarioUser.id, rolId: rolGerenteInventario.id } },
    update: {},
    create: { usuarioId: inventarioUser.id, rolId: rolGerenteInventario.id },
  });

  await prisma.cliCliente.upsert({
    where: { usuarioId: clienteUser.id },
    update: {
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      razonSocial: 'Cliente Demo',
      activo: true,
    },
    create: {
      usuarioId: clienteUser.id,
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      razonSocial: 'Cliente Demo',
      activo: true,
    }
  });

  // 3. Crear Categorías (Con sus prefijos SKU críticos)
  const catEle = await prisma.catCategoria.upsert({ 
    where: { prefijoSku: 'ELE' }, 
    update: {}, 
    create: { nombre: 'Electrónica', prefijoSku: 'ELE' }
  });
  const catRop = await prisma.catCategoria.upsert({ 
    where: { prefijoSku: 'ROP' }, 
    update: {}, 
    create: { nombre: 'Ropa y Moda', prefijoSku: 'ROP' }
  });
  const catHog = await prisma.catCategoria.upsert({
    where: { prefijoSku: 'HOG' },
    update: {},
    create: { nombre: 'Hogar y Cocina', prefijoSku: 'HOG' }
  });

  // 4. Proveedores demo
  const proveedoresSeed = [
    { ruc: '20123456781', razonSocial: 'Tech Import S.A.C.', contacto: 'ventas@techimport.pe' },
    { ruc: '20456789012', razonSocial: 'Moda Total E.I.R.L.', contacto: 'compras@modatotal.pe' },
    { ruc: '20678901234', razonSocial: 'Hogar Express S.A.', contacto: 'atencion@hogarexpress.pe' },
    { ruc: '20987654321', razonSocial: 'Distribuidora Andina', contacto: 'comercial@andina.pe' }
  ];
  for (const proveedor of proveedoresSeed) {
    await prisma.invProveedor.upsert({
      where: { ruc: proveedor.ruc },
      update: { razonSocial: proveedor.razonSocial, contacto: proveedor.contacto, activo: true },
      create: proveedor
    });
  }

  // 5. Estados de orden y métodos de envío
  const estadoPendiente = await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'pendiente_pago' },
    update: {},
    create: { nombre: 'pendiente_pago' }
  });
  const estadoPagada = await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'pagada' },
    update: {},
    create: { nombre: 'pagada' }
  });
  const estadoProceso = await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'en_proceso' },
    update: {},
    create: { nombre: 'en_proceso' }
  });
  await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'enviada' },
    update: {},
    create: { nombre: 'enviada' }
  });
  await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'entregada' },
    update: {},
    create: { nombre: 'entregada' }
  });
  await prisma.ordEstadoOrden.upsert({
    where: { nombre: 'cancelada' },
    update: {},
    create: { nombre: 'cancelada' }
  });

  const envioStandard = await prisma.ordMetodoEnvio.upsert({
    where: { id: 1 },
    update: { nombre: 'Estándar', costoBase: 15 },
    create: { id: 1, nombre: 'Estándar', costoBase: 15 }
  });

  // 6. Productos de ejemplo (más catálogo)
  const productosSeed: ProductoSeed[] = [
    { sku: 'ELE-001', nombre: 'Smartphone Galaxy X', categoriaId: catEle.id, precioCosto: 860, precioVenta: 1200, descripcion: 'Teléfono de gama alta con gran batería.', stockFisico: 24, imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200' },
    { sku: 'ELE-002', nombre: 'Laptop Pro 14"', categoriaId: catEle.id, precioCosto: 2850, precioVenta: 3899, descripcion: 'Laptop liviana para trabajo y diseño.', stockFisico: 12, imagen: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200' },
    { sku: 'ELE-003', nombre: 'Auriculares Noise Cancel', categoriaId: catEle.id, precioCosto: 320, precioVenta: 499, descripcion: 'Cancelación activa de ruido premium.', stockFisico: 40, imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200' },
    { sku: 'ELE-004', nombre: 'Smartwatch Fit Plus', categoriaId: catEle.id, precioCosto: 430, precioVenta: 699, descripcion: 'Reloj inteligente con monitoreo de salud.', stockFisico: 31, imagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200' },
    { sku: 'ROP-001', nombre: 'Camiseta Algodón Classic', categoriaId: catRop.id, precioCosto: 13, precioVenta: 25, descripcion: 'Camiseta de algodón peinado unisex.', stockFisico: 90, imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200' },
    { sku: 'ROP-002', nombre: 'Jean Slim Fit Azul', categoriaId: catRop.id, precioCosto: 46, precioVenta: 89, descripcion: 'Jean de corte slim con elastano.', stockFisico: 55, imagen: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200' },
    { sku: 'ROP-003', nombre: 'Casaca Impermeable', categoriaId: catRop.id, precioCosto: 92, precioVenta: 169, descripcion: 'Casaca ligera resistente a lluvia.', stockFisico: 26, imagen: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1200' },
    { sku: 'ROP-004', nombre: 'Zapatillas Urban Street', categoriaId: catRop.id, precioCosto: 84, precioVenta: 149, descripcion: 'Zapatillas cómodas para uso diario.', stockFisico: 47, imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200' },
    { sku: 'HOG-001', nombre: 'Licuadora PowerMix', categoriaId: catHog.id, precioCosto: 128, precioVenta: 199, descripcion: 'Licuadora de 1.5L con vaso de vidrio.', stockFisico: 33, imagen: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=1200' },
    { sku: 'HOG-002', nombre: 'Juego de Sartenes 3pzs', categoriaId: catHog.id, precioCosto: 156, precioVenta: 249, descripcion: 'Set antiadherente para cocina diaria.', stockFisico: 18, imagen: 'https://images.unsplash.com/photo-1584990347449-a64004b3f95e?w=1200' },
    { sku: 'HOG-003', nombre: 'Aspiradora Compact Turbo', categoriaId: catHog.id, precioCosto: 295, precioVenta: 459, descripcion: 'Aspiradora compacta con filtro HEPA.', stockFisico: 14, imagen: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200' },
    { sku: 'HOG-004', nombre: 'Set Organizador de Cocina', categoriaId: catHog.id, precioCosto: 49, precioVenta: 79, descripcion: 'Set de frascos y organizadores herméticos.', stockFisico: 62, imagen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200' }
  ];

  const productosCreados: Array<{ id: number; sku: string; nombre: string; precioVenta: number; stockFisico: number }> = [];
  for (const p of productosSeed) {
    const producto = await prisma.catProducto.upsert({
      where: { sku: p.sku },
      update: {
        nombre: p.nombre,
        imagenUrl: p.imagen,
        categoriaId: p.categoriaId,
        precioCosto: p.precioCosto,
        precioVenta: p.precioVenta,
        descripcion: p.descripcion,
        estado: 'activo',
        activo: true,
      },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        imagenUrl: p.imagen,
        categoriaId: p.categoriaId,
        precioCosto: p.precioCosto,
        precioVenta: p.precioVenta,
        descripcion: p.descripcion,
        estado: 'activo',
        activo: true,
        creadoPor: adminUser.id,
      }
    });

    await prisma.invStockProducto.upsert({
      where: { productoId: producto.id },
      update: { stockFisico: p.stockFisico, stockReservado: 0, stockMinimo: 5 },
      create: { productoId: producto.id, stockFisico: p.stockFisico, stockReservado: 0, stockMinimo: 5 }
    });

    await prisma.catImagenProducto.upsert({
      where: { id: producto.id * 10 + 1 },
      update: { urlImagen: p.imagen, orden: 0, productoId: producto.id },
      create: { id: producto.id * 10 + 1, productoId: producto.id, urlImagen: p.imagen, orden: 0 }
    });

    productosCreados.push({
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      precioVenta: Number(producto.precioVenta),
      stockFisico: p.stockFisico
    });
  }

  // 7. Órdenes demo para panel administrativo
  const clienteDemo = await prisma.cliCliente.findUnique({ where: { usuarioId: clienteUser.id } });
  if (clienteDemo) {
    const ordenesSeed = [
      { codigoOrden: 'ORD-DEMO-001', estadoId: estadoPendiente.id, items: [productosCreados[0], productosCreados[4]] },
      { codigoOrden: 'ORD-DEMO-002', estadoId: estadoPagada.id, items: [productosCreados[1], productosCreados[8]] },
      { codigoOrden: 'ORD-DEMO-003', estadoId: estadoProceso.id, items: [productosCreados[2], productosCreados[6]] }
    ];

    for (const o of ordenesSeed) {
      const subtotal = o.items.reduce((acc, item) => acc + item.precioVenta, 0);
      const impuestoIgv = subtotal * 0.18;
      const total = subtotal + impuestoIgv + Number(envioStandard.costoBase);

      const orden = await prisma.ordOrden.upsert({
        where: { codigoOrden: o.codigoOrden },
        update: {
          estadoId: o.estadoId,
          subtotal,
          impuestoIgv,
          costoEnvio: envioStandard.costoBase,
          total,
          metodoEnvioId: envioStandard.id
        },
        create: {
          clienteId: clienteDemo.id,
          codigoOrden: o.codigoOrden,
          estadoId: o.estadoId,
          metodoEnvioId: envioStandard.id,
          subtotal,
          impuestoIgv,
          costoEnvio: envioStandard.costoBase,
          total
        }
      });

      await prisma.ordItemOrden.deleteMany({ where: { ordenId: orden.id } });
      await prisma.ordItemOrden.createMany({
        data: o.items.map((item) => ({
          ordenId: orden.id,
          productoId: item.id,
          productoNombre: item.nombre,
          sku: item.sku,
          cantidad: 1,
          precioUnitario: item.precioVenta,
          subtotal: item.precioVenta
        }))
      });
    }
  }

  console.log('🔐 Usuarios de prueba:');
  console.log('- admin@stockflow.test / Admin123456!');
  console.log('- cliente@stockflow.test / Cliente123456!');
  console.log('- ventas@stockflow.test / Ventas123456!');
  console.log('- inventario@stockflow.test / Inventario123456!');
  console.log(`📦 Productos sembrados: ${productosSeed.length}`);
  console.log(`🏭 Proveedores sembrados: ${proveedoresSeed.length}`);
  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
