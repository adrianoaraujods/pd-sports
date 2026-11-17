(() => {
    let tema = "light";


    try {
        const salvo = localStorage.getItem("pd-sports:tema");

        if (salvo === "light" || salvo === "dark") {
            tema = salvo;
        }
    } catch {

    }

    document.documentElement.dataset.bsTheme = tema;

    document.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-alternar-tema]");
        if (!botao) return;

        const atual = document.documentElement.dataset.bsTheme;
        const novo = atual === "dark" ? "light" : "dark";

        document.documentElement.dataset.bsTheme = novo;

        try {
            localStorage.setItem("pd-sports:tema", novo);
        } catch {

        }
    })
})();
