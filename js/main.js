const initData = window.Telegram.WebApp.initData;
const params = new URLSearchParams(initData);
const user = JSON.parse(params.get('user'));

const hostTab = document.getElementById("host-tab");
const activeTab = document.getElementById("active-tab");
const joinedTab = document.getElementById("joined-tab");

const hostSection = document.getElementById("host-section");
const activeSection = document.getElementById("active-section");
const joinedSection = document.getElementById("joined-section");

const createGameButton = document.getElementById("create-game");
const modalOverlay = document.getElementById("modal-overlay");
const joinModal = document.getElementById("join-modal");
const confirmJoinButton = document.getElementById("confirm-join");
const cancelJoinButton = document.getElementById("cancel-join");

let selectedGameId = null;

hostTab.addEventListener("click", () => switchTab(hostTab, hostSection));
activeTab.addEventListener("click", () => {
  switchTab(activeTab, activeSection);
  attachJoinButtonListeners();
});

let joinedGamesFetched = false;

joinedTab.addEventListener("click", () => {
  switchTab(joinedTab, joinedSection);

  if (!joinedGamesFetched) {
    getJoinedGames(user.id);
    joinedGamesFetched = true;
  }
});

createGameButton.addEventListener("click", () => {
  createGame(user);
});

confirmJoinButton.addEventListener("click", () => {
  const character = document.getElementById("character-pick-modal").value;
  if (!selectedGameId || !character) {
    alert("Please select a character.");
    return;
  }
  joinGame(selectedGameId, character, user.id);
});

cancelJoinButton.addEventListener("click", closeJoinModal);

window.addEventListener("DOMContentLoaded", () => {
  switchTab(activeTab, activeSection);
  getAllGames();
  getJoinedGames(user.id);
});

function attachJoinButtonListeners() {
  document.querySelectorAll(".join-game-button").forEach((button) => {
    button.removeEventListener("click", handleJoinButtonClick);
    button.addEventListener("click", () => {
      selectedGameId = button.getAttribute("data-game-id");
      fetchUnusedCharacters(selectedGameId);
    });
  });
}

function handleJoinButtonClick() {
  selectedGameId = this.getAttribute("data-game-id");
  fetchUnusedCharacters(selectedGameId);
}

function fetchUnusedCharacters(gameId) {
  const apiUrl = `http://localhost:8080/characters/unused?gameId=${gameId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((response) => response.json())
  .then(data => {
    const characterSelect = document.getElementById("character-pick-modal");
    characterSelect.innerHTML = "<option value=''>Select Character</option>";

    data.items.forEach((character) => {
      const option = document.createElement("option");
      option.value = character.id;
      option.textContent = character.name;
      characterSelect.appendChild(option);
    });

    openJoinModal();
  })
  .catch((error) => {
    console.error("Error fetching unused characters:", error);
    alert("Failed to load characters. Please try again.");
  });
}

function openJoinModal() {
  joinModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeJoinModal() {
  joinModal.classList.remove("active");
  modalOverlay.classList.remove("active");
}

function switchTab(tab, section) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".content > div")
    .forEach((s) => (s.style.display = "none"));
  tab.classList.add("active");
  section.style.display = "block";
}

function getAllGames() {
  const apiUrl = "http://localhost:8080/games";

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      activeGames = data.items || [];
      renderActiveGames(); // Separate function to allow re-rendering
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function createGame(user) {
  const apiUrl = "http://localhost:8080/games/host";

  const name = document.getElementById("game-name").value.trim();
  const playerCount = document.getElementById("player-count").value;
  const number_of_players = playerCount ? parseInt(playerCount, 10) : 5;

  const requestData = {
    game: {
      name, 
      number_of_players, 
    },
    user: {
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      telegram_id: user.id,
    }
  };

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData), 
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to create the game");
    }
    return response.json();
  })
  .then((data) => {
    alert("Game created successfully!");

    document.getElementById("game-name").value = "";
    document.getElementById("player-count").value = "";

    switchTab(activeTab, activeSection);
    getAllGames();
  })
  .catch((error) => {
    console.error("Error:", error);
    alert("Failed to create the game. Please try again.");
  });
}

function joinGame(gameId, characterId, telegramUserId) {
  const apiUrl = "http://localhost:8080/games/join";

  const requestData = {
    gameId: parseInt(gameId),
    characterId: parseInt(characterId),
    telegramId: parseInt(telegramUserId),
  };

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Error from server:", errorMessage);
        alert(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then((data) => {
      alert("Successfully joined the game!");
      closeJoinModal();

      // Refresh both joined and active games after a successful join
      getJoinedGames(user.id);
      getAllGames();
    })
    .catch((error) => {
      console.error("Caught error:", error.message);
    });
}


function getJoinedGames(telegramId) {
  const apiUrl = `http://localhost:8080/games/joined?telegramId=${telegramId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      joinedGames = data.items || []; // Store joined games for comparison
      renderActiveGames(); // Refresh active games to reflect joined status
      const joinedGamesContainer = document.getElementById("joined-section");
      joinedGamesContainer.innerHTML = "<h3>Joined Games</h3>"; // Reset and add heading

      if (joinedGames.length > 0) {
        joinedGames.forEach((game) => {
          const gameCard = document.createElement("div");
          gameCard.className = "game-card";

          gameCard.innerHTML = `
            <h4>Game Name: ${game.Name}</h4>
            <p><strong>Status:</strong> ${game.Status}</p>
            <p><strong>Players Joined:</strong> ${game.ConnectedPlayers}/${game.NumberOfPlayers}</p>
            <p><strong>Created At:</strong> ${game.CreatedAt}</p>
          `;

          joinedGamesContainer.appendChild(gameCard);
        });
      } else {
        joinedGamesContainer.innerHTML += "<p>You have not joined any games yet.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching joined games:", error);
      alert("Failed to load joined games. Please try again.");
    });
}

function renderActiveGames() {
  const gamesContainer = document.getElementById("active-games");
  gamesContainer.innerHTML = ""; // Clear container before rendering

  activeGames.forEach((game) => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";

    // Check if the game is in the list of joined games
    const isJoined = joinedGames.some((joinedGame) => joinedGame.Id === game.Id);

    gameCard.innerHTML = `
      <h4>Game Name: ${game.Name}</h4>
      <p><strong>Status:</strong> ${game.Status}</p>
      <p><strong>Players Joined:</strong> ${game.ConnectedPlayers}/${game.NumberOfPlayers}</p>
      <p><strong>Created At:</strong> ${game.CreatedAt}</p>
      <button class="button join-game-button" data-game-id="${game.Id}" ${
        isJoined ? "disabled style='background-color: grey; cursor: not-allowed;'" : ""
      }>${isJoined ? "Already Joined" : "Join"}</button>
    `;

    gamesContainer.appendChild(gameCard);
  });

  attachJoinButtonListeners(); // Reattach listeners after rendering
}