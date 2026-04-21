import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default board and columns...");

  // Check if board already exists
  const existingBoard = await prisma.board.findFirst();
  if (existingBoard) {
    console.log("Database đã có dữ liệu, bỏ qua seeding.");
    return;
  }

  const boardTitle = "Dự án Aha Kanban";
  const prefix = "AK";

  const board = await prisma.board.create({
    data: {
      title: boardTitle,
      prefix: prefix,
      cardCounter: 0,
    },
  });

  const columns = [
    { title: "Chưa làm", order: 0 },
    { title: "Cần làm", order: 1 },
    { title: "Đang làm", order: 2 },
    { title: "Hoàn thành", order: 3 },
  ];

  for (const col of columns) {
    await prisma.column.create({
      data: {
        title: col.title,
        order: col.order,
        boardId: board.id,
      },
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
