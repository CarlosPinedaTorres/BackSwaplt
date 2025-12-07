import prisma from "../prisma.js";
import { retryPrisma } from "../utils/retryPrisma.js";





export const deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {

    const chat = await retryPrisma(() =>
      prisma.chat.findUnique({
        where: { id: parseInt(chatId) },
      })
    );

    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }


    await retryPrisma(() =>
      prisma.chat.delete({
        where: { id: parseInt(chatId) },
      })
    );

    res.json({ message: "Chat eliminado correctamente" });
  } catch (err) {
    console.error("Error eliminando chat:", err);
    res.status(500).json({ error: "Error eliminando chat" });
  }
};

export const createOrGetChat=async(req,res)=>{
    const {user1Id,user2Id,productId}=req.body;
    try{
        let chat = await retryPrisma(() =>
      prisma.chat.findUnique({
        where: {
          user1Id_user2Id_productId: { user1Id, user2Id, productId },
        },
      })
    );

      if (!chat) {
      chat = await retryPrisma(() =>
        prisma.chat.create({
          data: { user1Id, user2Id, productId },
        })
      );
    }

    res.json(chat);

    }catch(err){
        console.error("Error creando o obteniendo chat:", err);
        res.status(500).json({ error: "Error creando chat" });
    }


}




export const getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await retryPrisma(() =>
      prisma.message.findMany({
        where: { chatId: parseInt(chatId) },
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      })
    );

    res.json(messages);
  } catch (err) {
    console.error("Error obteniendo mensajes:", err);
    res.status(500).json({ error: "Error obteniendo mensajes" });
  }
};



export const sendMessage = async (req, res) => {
  const { chatId, senderId, content } = req.body;

  try {
    const message = await retryPrisma(() =>
      prisma.message.create({
        data: { chatId, senderId, content },
          include: {
          sender: { select: { id: true, nombre: true } }, 
        },
      })
    );
   await retryPrisma(() =>
      prisma.chat.update({
        where: { id: chatId },
        data: { lastMessageId: message.id, updatedAt: new Date() },
      })
    );

    res.json(message);
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    res.status(500).json({ error: "Error enviando mensaje" });
  }
};


export const getMyChats = async (req, res) => {
  const { userId } = req.params; 

  try {
    const chats = await retryPrisma(() =>
      prisma.chat.findMany({
        where: {
          OR: [
            { user1Id: parseInt(userId) },
            { user2Id: parseInt(userId) },
          ],
        },
        include: {
        
          lastMessage: {
            include: {
              sender: {
                select: { id: true, nombre: true },
              },
            },
          },

  
          user1: { select: { id: true, nombre: true, fotoPerfil: true } },
          user2: { select: { id: true, nombre: true, fotoPerfil: true } },

          product: {
            select: {
              id: true,
              nombre: true,
              fotos: { select: { url: true }, take: 1 },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    );


    const formattedChats = chats.map((chat) => {
      const isUser1 = chat.user1Id === parseInt(userId);
      const otherUser = isUser1 ? chat.user2 : chat.user1;

      return {
        id: chat.id,
        product: chat.product,
        otherUser,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
      };
    });

    res.json(formattedChats);
  } catch (err) {
    console.error(" Error obteniendo chats del usuario:", err);
    res.status(500).json({ error: "Error obteniendo chats del usuario" });
  }
};
