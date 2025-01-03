import { switchTab } from "./tabs.js";
import { openJoinModal, closeJoinModal } from "./modal.js";
import { getAllGames, createGame } from "./games.js";

document.addEventListener("DOMContentLoaded", () => {
  const hostTab = document.getElementById("host-tab");
  const activeTab = document.getElementById("active-tab");
  const joinedTab = document.getElementById("joined-tab");

  const hostSection = document.getElementById("host-section");
  const activeSection = document.getElementById("active-section");
  const joinedSection = document.getElementById("joined-section");

  hostTab.addEventListener("click", () => switchTab(hostTab, hostSection));
  activeTab.addEventListener("click", () => switchTab(activeTab, activeSection));
  joinedTab.addEventListener("click", () => switchTab(joinedTab, joinedSection));

  document.getElementById("create-game").addEventListener("click", () => {
    const user = {
      username: "example_user",
      first_name: "Example",
      last_name: "User",
      telegram_id: 12345,
    };
    createGame(user);
  });

  document.getElementById("confirm-join").addEventListener("click", closeJoinModal);
  document.getElementById("cancel-join").addEventListener("click", closeJoinModal);

  getAllGames();
});
