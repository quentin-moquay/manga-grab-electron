
class Grabber {

    constructor() {
        this.initialize_ended = false
        this.http = require('http')
        this.https = require('https')
        this.fs = require('fs')
    }

    grab_file(data, dir) {
        data.report.chapters.splice(0,data.report.chapters.length)
        this.initialize_ended = false
        const PadNumber = require('./pad_number.js')
        let idx = data.chapter.value

        while (idx <= data.finalChapter && data.running){
            let current_chapter = new PadNumber()
            current_chapter.value = idx
            current_chapter.pad = data.chapter.pad
            this.fs.mkdir(dir+'/'+idx, (e) => {
                if(!e || (e && e.code === 'EEXIST')){
                    if(current_chapter.value == data.finalChapter) {
                        this.initialize_ended = true
                    }
                    data.report.chapters.push({index: current_chapter.value, running: true, pages: []})
                    this.grab_chapter(data, dir, current_chapter)
                } else {
                    console.log(e)
                }
            })
            idx++
        }
    }

    async grab_chapter(data, dir, current_chapter){
        const PadNumber = require('./pad_number.js')
        var chapterData = {
            url : data.url,
            chapter_completed: false,
            chapter: new PadNumber(),
            page: new PadNumber(),
            errors: []
        }
        chapterData.chapter.pad = current_chapter.pad
        chapterData.chapter.value = current_chapter.value
        chapterData.page.pad = data.page.pad
        chapterData.page.value = data.page.value

        while (!chapterData.chapter_completed && data.running) {
            let new_url = this.replace_name(chapterData)
            this.download(new_url, chapterData.page, chapterData, data, dir)
            chapterData.page.next()
            await this.sleep(200)
        }
    }

    sleep(ms){
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }
    
    replace_name(data){
        return data.url.replace(/:chapter:/gi, data.chapter).replace(/:page:/gi, data.page)
    }
    
    download(url, page, chapterData, data, dir){

        const fs = this.fs
        let module = url.toLowerCase().indexOf("http:") !== -1 ? this.http : this.https

        module.get(url, (response) => {
            if (response.statusCode === 200) {
                var report = data.report.chapters.find( it => it.index === chapterData.chapter.value)
                report.pages.push(chapterData.page.value)
                report.pages.sort((a, b) => a - b)
                const file = fs.createWriteStream(dir+'/'+chapterData.chapter+"/"+chapterData.page+".jpg")
                response.pipe(file)
            } else {
                //console.log(response.statusCode + " error with " + url)
                if (chapterData.errors.includes(page.value - 1)
                || chapterData.errors.includes(page.value + 1)) {
                    // two consecutives numbers, stop
                    var report = data.report.chapters.find( it => it.index === chapterData.chapter.value)
                    report.running = false
                    chapterData.chapter_completed = true
                    if(app.report.chapters.every( (it) => { return !it.running }) && this.initialize_ended) {
                        data.running = false
                    }
                }
                chapterData.errors.push(page.value)
            }
        })
    }
    
}

module.exports = Grabber