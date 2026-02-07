import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// 静态文件（public）
app.use(express.static(path.join(__dirname, "public")));

// 保存用户颜色
let userColors = {};

function randomColor() {
  return {
    r: Math.floor(100 + Math.random() * 155),
    g: Math.floor(100 + Math.random() * 155),
    b: Math.floor(100 + Math.random() * 155),
  };
}

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  // 分配并保存颜色
  userColors[socket.id] = randomColor();

  // 广播在线人数
  io.emit("count", io.engine.clientsCount);

  // 接收文本
  socket.on("sendText", (data) => {
    if (!data || !data.text) return;

    io.emit("newText", {
      id: Date.now(),
      text: data.text,
      color: userColors[socket.id],
    });
  });

  socket.on("disconnect", () => {
    delete userColors[socket.id];
    io.emit("count", io.engine.clientsCount);
  });
});

server.listen(PORT, () => {
  console.log("Running at http://localhost:3000");
});
