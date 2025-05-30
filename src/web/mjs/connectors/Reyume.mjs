import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Reyume extends Connector {
    constructor() {
        super();
        super.id = 'reyume';
        super.label = 'ReYume';
        this.tags = [ 'manga', 'scanlation', 'indonesian' ];
        this.url = 'https://www.re-yume.my.id';
    }

    async _getMangas() {
        const mangalist = [];
        const request = new Request(new URL('/feeds/posts/default/-/Series?orderby=published&alt=json&max-results=999', this.url), this.requestOptions);
        const { feed } = await this.fetchJSON(request);
        feed.entry.map(manga => {
            const goodLink = manga.link.find(link => link.rel === 'alternate');
            mangalist.push({
                id: this.getRootRelativeOrAbsoluteLink(goodLink.href, request.url),
                title: goodLink.title.trim()
            });
        });
        return mangalist;
    }

    async _getChapters(manga) {
        let request = new Request(new URL(manga.id, this.url), this.requestOptions);
        const mangaid = await Engine.Request.fetchUI(request, 'clwd.settings.cat');

        request = new Request(new URL('/feeds/posts/default/-/'+mangaid+'?orderby=published&alt=json&max-results=9999', this.url), this.requestOptions);
        const { feed } = await this.fetchJSON(request);

        const chapterslist = feed.entry.map(entry => {
            const goodLink = entry.link.find(link => link.rel === 'alternate');
            return {
                id: this.getRootRelativeOrAbsoluteLink(goodLink.href, request.url),
                title: goodLink.title.replace(manga.title, '').trim()
            };
        }).filter(chap => chap.id != manga.id);
        return chapterslist;
    }

    async _getChapterListFromPages(manga, mangaid) {
        const request = new Request(new URL('/feeds/posts/default/-/'+mangaid+'?orderby=published&alt=json&max-results=999', this.url), this.requestOptions);
        const { feed } = await this.fetchJSON(request);

        const chapterslist = feed.entry.map((entry) => {
            const goodLink = entry.link.find((link) => link.rel === "alternate");
            return {
                id: this.getRootRelativeOrAbsoluteLink(goodLink.href, request.url),
                title: goodLink.title.replace(/.*(?=Chapter)/g, "").trim(),
            };
        }).filter((chap) => chap.id != manga.id);
        return chapterslist;
    }

    async _getPages(chapter) {
        const scriptPages = `
            new Promise(resolve => {
                resolve([...document.querySelectorAll('article#reader img')].map(img => img.src));
            });
        `;
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        return await Engine.Request.fetchUI(request, scriptPages);
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const title = (await this.fetchDOM(request, 'h1[itemprop="name"]'))[0].textContent.trim();
        return new Manga(this, uri.pathname, title);
    }
}
