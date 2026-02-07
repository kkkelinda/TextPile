const socket = io();



let onlineCount = 1;

// 给 sketch.js 用
function setOnlineCount(n) {
  onlineCount = Math.max(1, n);
  if (window.setPlayers) window.setPlayers(onlineCount);
}

socket.on("count", (n) => {
  document.getElementById("count").innerText = "Online: " + n;
  setOnlineCount(n);
});

socket.on("newText", (data) => {
  // data = { id, text, color:{r,g,b} }
  if (window.addBullet) window.addBullet(data);
});

window.addEventListener("load", () => {
  const input = document.getElementById("msg");
  input.focus();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = (input.value || "").trim();
      if (text.length === 0) return;

      socket.emit("sendText", { text: text });
      input.value = "";
    }
  });
});
