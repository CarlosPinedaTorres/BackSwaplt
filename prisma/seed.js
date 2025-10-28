import prisma from "../src/prisma.js";

async function main(){
    console.log("Iniciando seed");

    const categorias=[
        "Electronica",
        "Ropa",
        "Muebles",
        "Juguetes",
        "Libros",
        "Deportes",
        "Hogar y Cocina",
    ];

    for (const nombre of categorias){
        await prisma.categoria.upsert({
            where:{nombre},
            update:{},
            create:{nombre},
        })
    }

    const tipos=["Intercambio","Venta","Ambos"];

    for(const nombre of tipos){
            await prisma.tipo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    }

      const estados = ["Nuevo", "Como nuevo", "Usado", "Dañado"];

  for (const nombre of estados) {
    await prisma.estado.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log("✅ Seed completado correctamente.");


}

main()
  .catch((error) => {
    console.error("❌ Error en la seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });