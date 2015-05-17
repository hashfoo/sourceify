require("jasmine");
var bundler = require("./fixtures/bundler");

describe("A suite", function() {
    it("contains a spec", function() {
        expect(true).toBe(true);
    });
});

describe("bundler", function() {
    it("returns the bundle", function(done) {
        bundler.bundle({
            callback: function(b) {
                expect(typeof(b)).toBe('string');
                done();
            }
        })
    });
});
