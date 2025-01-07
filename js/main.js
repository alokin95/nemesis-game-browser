const BASE_URL = "http://localhost:8080";

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
let joinedGames = [];

document.getElementById("save-finish-game").addEventListener("click", () => {
  const objectiveId = document.getElementById("objective-id").value;
  const objectiveCompleted = document.getElementById("objective-completed").value;
  const finishedOn = document.getElementById("finished-on").value;
  const playerStatus = document.getElementById("player-status").value;
  const deathId = document.getElementById("death-id").value;

  if (!objectiveId || !finishedOn || !playerStatus || (playerStatus === "dead" && !deathId)) {
    alert("Please fill in all required fields.");
    return;
  }

  const requestData = {
    telegramId: user.id,
    gameId: parseInt(selectedGameId),
    objectiveId: parseInt(objectiveId),
    objectiveCompleted: objectiveCompleted === "true",
    finishedOn: parseInt(finishedOn),
    playerStatus: playerStatus,
    deathId: playerStatus === "dead" ? parseInt(deathId) : null,
  };

  finishGame(requestData);
  closeFinishGameModal();
});

document.getElementById("player-status").addEventListener("change", (event) => {
  const deathTypeGroup = document.getElementById("death-type-group");
  const playerStatus = event.target.value;

  if (playerStatus === "dead") {
    fetchDeaths(); // Fetch death types when "Dead" is selected
    deathTypeGroup.style.display = "block";
  } else {
    deathTypeGroup.style.display = "none"; // Hide the dropdown for other statuses
    document.getElementById("death-id").value = ""; // Clear previous selection
  }
});

document.getElementById("cancel-finish-game").addEventListener("click", closeFinishGameModal);

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
  const playerOrder = document.getElementById("player-order-modal").value;

  if (!selectedGameId || !character || !playerOrder) {
    alert("Please select both a character and a player order.");
    return;
  }

  joinGame(selectedGameId, character, playerOrder, user.id);
});

cancelJoinButton.addEventListener("click", closeJoinModal);

window.addEventListener("DOMContentLoaded", async () => {
  switchTab(activeTab, activeSection);
  await getJoinedGames(user.id);
  getAllGames();
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
  const apiUrl = `${BASE_URL}/characters/available?gameId=${gameId}`;

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
  const apiUrl = `${BASE_URL}/games`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      activeGames = data.items || [];
      console.log(activeGames)
      console.log(joinedGames)
      renderActiveGames();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function createGame(user) {
  const apiUrl = `${BASE_URL}/games/host`;

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

function joinGame(gameId, characterId, playerOrder, telegramUserId) {
  const apiUrl = `${BASE_URL}/games/join`;

  const requestData = {
    gameId: parseInt(gameId),
    characterId: parseInt(characterId),
    playerOrder: parseInt(playerOrder),
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
    .then(() => {
      alert("Successfully joined the game!");
      closeJoinModal();

      getJoinedGames(telegramUserId);
      getAllGames();

      switchTab(joinedTab, joinedSection);
    })
    .catch((error) => {
      console.error("Caught error:", error.message);
    });
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

function getJoinedGames(telegramId) {
  const apiUrl = `${BASE_URL}/games/joined?telegramId=${telegramId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      joinedGames = data.items || [];
      const joinedGamesContainer = document.getElementById("joined-section");
      joinedGamesContainer.innerHTML = "<h3>Joined Games</h3>";

      if (joinedGames.length > 0) {
        joinedGames.forEach((game) => {
          const gameCard = document.createElement("div");
          gameCard.className = "game-card";

          const finishGameButton = game.GameFinished
            ? `<button class="button game-finished-button" disabled style='background-color: grey; cursor: not-allowed;'">Game Finished</button>`
            : `<button class="button finish-game-button" data-game-id="${game.Id}">Finish Game</button>`;

          let endGameButton = "";
          if (game.TelegramId === user.id) {
            endGameButton = game.CompletedAt !== ""
              ? `<button class="button game-ended-button" disabled style='background-color: grey; cursor: not-allowed;'">Game Ended</button>`
              : `<button class="button end-game-button" data-game-id="${game.Id}">End Game</button>`;
          }

          gameCard.innerHTML = `
            <h4>Game Name: ${game.Name}</h4>
            <p><strong>Status:</strong> ${game.Status}</p>
            <p><strong>Players Joined:</strong> ${game.ConnectedPlayers}/${game.NumberOfPlayers}</p>
            <p><strong>Created At:</strong> ${game.CreatedAt}</p>
            ${finishGameButton}
            ${endGameButton}
          `;

          joinedGamesContainer.appendChild(gameCard);
        });

        attachFinishGameButtonListeners();
        attachEndGameButtonListeners();
      } else {
        joinedGamesContainer.innerHTML += "<p>You have not joined any games yet.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching joined games:", error);
      alert("Failed to load joined games. Please try again.");
    });
}

function attachFinishGameButtonListeners() {
  document.querySelectorAll(".finish-game-button").forEach((button) => {
    button.removeEventListener("click", handleFinishGameClick);
    button.addEventListener("click", handleFinishGameClick);
  });
}

function handleFinishGameClick(event) {
  const gameId = event.target.getAttribute("data-game-id");
  if (!gameId) {
    console.error("Game ID is required to finish a game.");
    return;
  }

  selectedGameId = gameId; // Store globally for other operations
  openFinishGameModal(gameId); // Pass the gameId to fetch objectives
}

function finishGame(data) {
  const apiUrl = `${BASE_URL}/games/finish`;

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
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
    .then(() => {
      alert("Game finished successfully!");
      getJoinedGames(user.id); // Refresh joined games list after finishing
    })
    .catch((error) => {
      console.error("Error finishing game:", error.message);
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

    let endGameButton = "";
    if (game.TelegramId === user.id) {
      endGameButton = game.CompletedAt !== ""
        ? `<button class="button game-ended-button" disabled style='background-color: grey; cursor: not-allowed;'">Game Ended</button>`
        : `<button class="button end-game-button" data-game-id="${game.Id}">End Game</button>`;
    }

    gameCard.innerHTML = `
      <h4>Game Name: ${game.Name}</h4>
      <p><strong>Status:</strong> ${game.Status}</p>
      <p><strong>Players Joined:</strong> ${game.ConnectedPlayers}/${game.NumberOfPlayers}</p>
      <p><strong>Created At:</strong> ${game.CreatedAt}</p>
      <button class="button join-game-button" data-game-id="${game.Id}" ${isJoined ? "disabled style='background-color: grey; cursor: not-allowed;'" : ""
      }>${isJoined ? "Joined" : "Join"}</button>
      ${endGameButton}
    `;

    gamesContainer.appendChild(gameCard);

    attachEndGameButtonListeners();
  });

  attachJoinButtonListeners(); // Reattach listeners after rendering
}

function openFinishGameModal(gameId) {
  fetchObjectives(gameId);
  populateFinishedOnDropdown();

  const finishGameModal = document.getElementById("finish-game-modal");
  finishGameModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeFinishGameModal() {
  const finishGameModal = document.getElementById("finish-game-modal");
  finishGameModal.classList.remove("active");
  modalOverlay.classList.remove("active");
}

function fetchObjectives(gameId) {
  const apiUrl = `${BASE_URL}/objectives/available?gameId=${gameId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const objectiveSelect = document.getElementById("objective-id");
      objectiveSelect.innerHTML = "<option value=''>Select Objective</option>";

      data.items.forEach((objective) => {
        const option = document.createElement("option");
        option.value = objective.id;
        option.textContent = objective.name;
        objectiveSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching objectives:", error);
      alert("Failed to load objectives. Please try again.");
    });
}

// Call this function when opening the modal
openFinishGameModal = () => {
  populateFinishedOnDropdown();
  fetchObjectives(selectedGameId);
  const finishGameModal = document.getElementById("finish-game-modal");
  finishGameModal.classList.add("active");
  modalOverlay.classList.add("active");
};

function fetchDeaths() {
  const apiUrl = `${BASE_URL}/deaths`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const deathSelect = document.getElementById("death-id");
      deathSelect.innerHTML = "<option value=''>Select Death Type</option>"; // Reset dropdown

      data.items.forEach((death) => {
        const option = document.createElement("option");
        option.value = death.id;
        option.textContent = death.name;
        deathSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching deaths:", error);
      alert("Failed to load death types. Please try again.");
    });
}

function populateFinishedOnDropdown() {
  const finishedOnSelect = document.getElementById("finished-on");
  finishedOnSelect.innerHTML = "<option value=''>Select Turn (1-15)</option>"; // Reset options

  for (let i = 1; i <= 15; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    finishedOnSelect.appendChild(option);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  attachEndGameButtonListeners();
});

function attachEndGameButtonListeners() {
  document.querySelectorAll(".end-game-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      selectedGameId = event.target.getAttribute("data-game-id");
      openEndGameModal();
    });
  });
}

function openEndGameModal() {
  populateRoundDropdown();
  const endGameModal = document.getElementById("end-game-modal");
  const modalOverlay = document.getElementById("modal-overlay");

  endGameModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeEndGameModal() {
  const endGameModal = document.getElementById("end-game-modal");
  const modalOverlay = document.getElementById("modal-overlay");

  endGameModal.classList.remove("active");
  modalOverlay.classList.remove("active");
}

function populateRoundDropdown() {
  const roundSelect = document.getElementById("round");
  roundSelect.innerHTML = "";

  for (let i = 0; i <= 15; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    roundSelect.appendChild(option);
  }
}

document.getElementById("confirm-end-game").addEventListener("click", () => {
  const requestData = {
    gameId: parseInt(selectedGameId),
    coordinates: document.getElementById("coordinates").value,
    round: parseInt(document.getElementById("round").value),
    engine1: document.getElementById("engine-1").checked,
    engine2: document.getElementById("engine-2").checked,
    engine3: document.getElementById("engine-3").checked,
    explored: document.getElementById("explored").value === "true",
    causeOfDestruction: document.getElementById("cause-of-destruction").value,
    telegramId: user.id,
  };

  if (!requestData.round || !requestData.causeOfDestruction) {
    alert("Please fill in all required fields.");
    return;
  }

  endGame(requestData);
  closeEndGameModal();
});

document.getElementById("cancel-end-game").addEventListener("click", closeEndGameModal);

function endGame(data) {
  const apiUrl = `${BASE_URL}/games/end`;

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to end the game.");
      }
      return response.json();
    })
    .then(() => {
      alert("Game ended successfully!");
      getAllGames();
      getJoinedGames(user.id);
    })
    .catch((error) => {
      console.error("Error ending game:", error.message);
    });
}
