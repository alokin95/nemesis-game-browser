export function switchTab(tab, section) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".content > div").forEach((s) => (s.style.display = "none"));
    tab.classList.add("active");
    section.style.display = "block";
  }
  