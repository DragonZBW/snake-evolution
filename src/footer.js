const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">

<footer class="footer has-background-grey-darker my-0">
  <div class="content has-text-centered">
    <p>
    Contact zbw5667@g.rit.edu, hz1220@g.rit.edu Copyright &copy;2022 Zack Wilson, Hongfei Zhu
    </p>
  </div>
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