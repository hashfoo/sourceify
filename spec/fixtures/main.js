//var R = require("react");
var _h = require("./framework/react-dom");
var Main = (function () {
    function Main() {
    }
    Main.hello = function () {
        var div = _h.div();
        console.log("hello!");
    };
    return Main;
})();
exports.Main = Main;
R.render(_h.div(null, [
    _h.form({ noValidate: true }, [
        _h.button(null, "Hello Button!"),
        _h.label(null, [
            "Hello Label:",
            _h.input({ value: "Hello Input" })
        ]),
        _h.textarea({ value: "Hello Text Area!" })
    ])
]), document.getElementById("app"));
console.log("do we have mappings!!!?");
//# sourceMappingURL=main.js.map
