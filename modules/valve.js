// Throttles callback-based async functions
function Valve(subject, max) {
    var self    = this
        ,max    = parseInt(max, 10)
        ,max    = max > 0 ? max : 5
        ,active = 0
        ,queue  = [];
    
    function push() {
        queue.push(Array.prototype.slice.call(arguments, 0));
        doWork();
    }
    
    function doWork() {
        if (active >= max) { return; }
        
        var argsIn = queue.shift();
        if (!argsIn) { return; }
        
        active++;
        subject.apply(subject, argsIn.concat([didFinish]));
    
        function didFinish() {
            active--;
            
            var argsOut = Array.prototype.slice.call(arguments, 0).concat(argsIn);
            argsOut.unshift('result');
            self.emit.apply(self, argsOut);
            
            if (queue.length == 0 && active == 0) {
                self.emit('empty');
            }
            
            doWork();
        }
    }
    
    this.push = push;
}
Valve.prototype = new process.EventEmitter();

module.exports = Valve;