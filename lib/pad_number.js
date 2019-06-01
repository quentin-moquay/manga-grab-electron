class PadNumber {

    constructor() {
        this.pad = 1
        this.value = 0
    }

    next() {
        this.value++
    }

    toString() {
        return this.value.toString().padStart(this.pad,0)
    }
}

module.exports = PadNumber