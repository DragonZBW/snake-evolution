const template = document.createElement("template");
template.innerHTML = `
<footer>
<p class="footer is-size-7">Contact zbw5667@g.rit.edu, hz1220@g.rit.edu Copyright &copy;2022 Zack Wilson, Hongfei Zhu</p>
</footer>
`;

class Footer extends HTMLElement {
    constructor() {
        super();
        // 1 - attach a shadow DOM tree to this instance - this creates `.shadowRoot` for us
        this.attachShadow({ mode: "open" });

        // 2 - Clone `template` and append it
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

}
customElements.define('app-footer', Footer);