export function openJoinModal() {
    document.getElementById("join-modal").classList.add("active");
    document.getElementById("modal-overlay").classList.add("active");
  }
  
  export function closeJoinModal() {
    document.getElementById("join-modal").classList.remove("active");
    document.getElementById("modal-overlay").classList.remove("active");
  }
  