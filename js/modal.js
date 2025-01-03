export function openJoinModal(gameId) {
    const modal = document.getElementById("join-modal");
    const overlay = document.getElementById("modal-overlay");
    const dropdown = document.getElementById("character-pick-modal");
  
    // Clear existing options
    dropdown.innerHTML = '<option value="">Select Character</option>';
  
    // Fetch characters from the server
    fetch(`http://localhost:8080/characters?gameId=${gameId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch characters");
        }
        return response.json();
      })
      .then(data => {
        console.log(data)
        // Populate dropdown with fetched characters
        data.items.forEach((character) => {
          const option = document.createElement("option");
          option.value = character.id;
          option.textContent = character.name;
          dropdown.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error fetching characters:", error);
        alert("Failed to load characters. Please try again.");
      });
  
    // Show the modal
    modal.classList.add("active");
    overlay.classList.add("active");
  }
  
  export function closeJoinModal() {
    const modal = document.getElementById("join-modal");
    const overlay = document.getElementById("modal-overlay");
    modal.classList.remove("active");
    overlay.classList.remove("active");
  }
  