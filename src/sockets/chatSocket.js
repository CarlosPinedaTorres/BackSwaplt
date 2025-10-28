import prisma from "../prisma.js";

export const configureChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");


    socket.on("joinChat", (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(` Usuario unido a chat_${chatId}`);
    });


    socket.on("sendMessage", (message) => {
      if (!message?.chatId) {
        console.error(" Mensaje inválido recibido por el socket:", message);
        return;
      }

      io.to(`chat_${message.chatId}`).emit("newMessage", message);
      console.log(` Mensaje reenviado a chat_${message.chatId}:`, message.content);
    });

    socket.on("disconnect", () => {
      console.log(" Cliente desconectado");
    });
  });
};
