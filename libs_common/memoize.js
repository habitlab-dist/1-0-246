(function(){
  var memoizeSingleAsync, memoize, out$ = typeof exports != 'undefined' && exports || this;
  out$.memoizeSingleAsync = memoizeSingleAsync = function(func){
    var cached_promise;
    cached_promise = null;
    return function(){
      var result;
      if (cached_promise != null) {
        return cached_promise;
      }
      result = func();
      cached_promise = result;
      return result;
    };
  };
  out$.memoize = memoize = function(func){
    var memo, slice;
    memo = {};
    slice = Array.prototype.slice;
    return function(){
      var args;
      args = slice.call(arguments);
      if (memo[args] != null) {
        return memo[args];
      } else {
        return memo[args] = func.apply(this, args);
      }
    };
  };
}).call(this);
