class BlockingLoader {

    constructor() {

        if(this.el)
            return;

        //<div id="blocking-loader" class="loader-wrapper"><div class="loader-spinner"></div></div>
        this.el = document.createElement("div");
        this.el.id = "blocking-loader";
        this.el.classList.add("loader-wrapper");
        this.el.style.display = "none";

        const iEl = document.createElement("div");
        iEl.classList.add("loader-spinner");

        this.el.append(iEl);


        document.body.append(this.el);

    }

    show() {
        this.el.style.display = "block";
    }

    hide() {
        this.el.style.display = "none";

        if(this.progressEl) {
            this.progressEl.style.display = "none";
            this.progressEl.innerHTML = "";
        }

        if(this.messageEl) {
            this.messageEl.style.display = "none";
            this.messageEl.innerHTML = "";
        }
    }

    setProgress(number) {

        if(!this.progressEl) {
            this.progressEl = document.createElement("span");
            this.progressEl.classList.add("loader-progress");

            this.el.append(this.progressEl);
        }

        if(this.progressEl.style.display === 'none')
            this.progressEl.style.display = 'block';

        this.progressEl.innerHTML = number + "%";
    }

    setMessage(message) {

        if(!this.messageEl) {
            this.messageEl = document.createElement("span");
            this.messageEl.classList.add("loader-message");

            this.el.append(this.messageEl);
        }

        if(this.messageEl.style.display === 'none')
            this.messageEl.style.display = 'block';

        this.messageEl.innerHTML = message;
    }

}

module.exports = new BlockingLoader();