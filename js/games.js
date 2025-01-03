import { openJoinModal } from "./modal.js";

export function getAllGames() {
  const apiUrl = "http://localhost:8080/games";

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      const gamesContainer = document.getElementById("active-games");
      gamesContainer.innerHTML = "";

      data.items.forEach((game) => {
        const gameCard = document.createElement("div");
        gameCard.className = "game-card";

        gameCard.innerHTML = `
          <h4>Game Name: ${game.Name}</h4>
          <p><strong>Status:</strong> ${game.Status}</p>
          <p><strong>Players Joined:</strong> ${game.ConnectedPlayers}/${game.NumberOfPlayers}</p>
          <button class="button join-game-button" data-game-id="${game.Id}">Join</button>
        `;

        gamesContainer.appendChild(gameCard);

        // Attach event listener to "Join" button
        gameCard.querySelector(".join-game-button").addEventListener("click", () => {
          openJoinModal(game.Id);
        });
      });
    })
    .catch((error) => console.error("Error fetching games:", error));
}
  
  export function createGame(user) {
    const apiUrl = "http://localhost:8080/games/host";
  
    const name = document.getElementById("game-name").value.trim();
    const playerCount = document.getElementById("player-count").value;
    const requestData = {
      game: { name, number_of_players: parseInt(playerCount, 10) || 5 },
      user,
    };
  
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then(() => {
        alert("Game created successfully!");
        getAllGames();
      })
      .catch((error) => console.error("Error creating game:", error));
  }
  