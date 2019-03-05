// Change the name of the module for what you want
var trianglefunModule = (function () {
"use strict";

    const w3="http://www.w3.org/"
    const svgNS=w3+"2000/svg"
    const xlinkNS=w3+"1999/xlink"
    const R = Math.random;
    const Q = Math.sqrt

    let canvas = {};
    canvas.w = window.innerWidth;
    canvas.h = window.innerHeight;

    var svg = null;

    var el;

    function makeSVG(parent, tag, attrs={}) {
        var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (let k in attrs){
            if(k=="xlink:href"){
                el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attrs[k]);
            }else{
                el.setAttribute(k, attrs[k]);
            }
        }
        parent.appendChild(el);
        return el;
    }

    function draw(name, attrs){
    	el = document.createElementNS(svgNS, name)
    	if(attrs) attribs(el, attrs)
    	return el
    }

    function attribs(el,attrs){
    	for(let x in attrs)
    		if(attrs.hasOwnProperty(x)&&attrs[x]!==undefined)
    			el.setAttribute(x,attrs[x])
    }

    function raise(el,type){
    	var evt = document.createEvent("Event")
    	evt.initEvent(type,true,true)
    	el.dispatchEvent(evt)
    }

    function Point(x,y,role){
    	var t=this
    	if(!(this instanceof Point))return new Point(x,y,role)
    	if(role===undefined)role="draggable"
    	t.el=draw("circle",{"class":role, "r":role=="draggable"?13:5})
    	svg.appendChild(this.el)
    	t.x=isNaN(x)?(R()*canvas.w)|0:x
    	t.y=isNaN(y)?(R()*canvas.h)|0:y
    	if(role=="draggable"){
    		t.el.addEventListener("mousedown",function(){
    			t.drag=true
    		})
    		window.addEventListener("mousemove",function(e){
    			if(t.drag)t.x=e.clientX,t.y=e.clientY
    		})
    		t.el.addEventListener("mouseup",function(){
    			t.drag=false
    		})
    		t.el.addEventListener("touchstart",function(e){
    			t.drag=true
    		})
    		t.el.addEventListener("touchmove",function(e){
    			e.preventDefault()
    			if(t.drag)
    				t.x=e.touches[0].clientX,
    				t.y=e.touches[0].clientY
    		})
    		t.el.addEventListener("touchend",function(e){
    			t.drag=false
    		})
    	}
    }

    Object.defineProperty(Point.prototype,"x",{
    	get:function(){return parseFloat(this.el.getAttribute("cx"))},
    	set:function(val){this.el.setAttribute("cx",val);raise(this.el,"move")}
    })

    Object.defineProperty(Point.prototype,"y",{
    	get:function(){return parseFloat(this.el.getAttribute("cy"))},
    	set:function(val){this.el.setAttribute("cy",val);raise(this.el,"move")}
    })

    Point.prototype.distanceTo=function(P,dx,dy) {
    	dx=P.x-this.x
    	dy=P.y-this.y
    	return Q(dx*dx+dy*dy)
    }

    Point.prototype.midPointTo=function(P,dx,dy) {
    	return {x:this.x+(P.x-this.x)/2,
    		    y:this.y+(P.y-this.y)/2}
    }

    Point.prototype.toString=function(){
    	return this.x+","+this.y
    }

    function Triangle(A,B,C){
    	var t=this,here;
    	if(!(t instanceof Triangle)) {
            return new Triangle(A,B,C);
        }
    	t.p=[A,B,C]
    	for(let i=3;i--;){
    		if(t.p[i] instanceof Point)continue
    		if(t.p[i] instanceof Array) {
    			t.p[i]=Point(t.p[i][0],t.p[i][1])
    		} else {
    			t.p[i]=Point()
    		}
    	}
    	t.path=draw("path")
    	t.gravityPoint = Point(-999,-999, "grav-point")
    	t.innerPoint   = Point(-999,-999, "inner-point")
    	t.innerCircle  = draw("circle",{"class":"inner"})
    	t.circumPoint  = Point(-999,-999, "circum-point")
    	t.circumCircle = draw("circle",{"class":"circum"})

    	here = svg.querySelector('.draggable')
    	svg.insertBefore(t.path,here)
    	svg.insertBefore(t.innerCircle,here)
    	svg.insertBefore(t.circumCircle,here)
    	t.update()
    	for(let i=3;i--;)
    		t.p[i].el.addEventListener("move", function(e){
    			t.update()
    		})
    }

    Triangle.prototype.update=function(){
    	//      C
    	//     / \
    	//   b/   \a
    	//   /     \
    	//  A-------B
    	//      c
    	var t=this,D,
    		A=t.p[0],B=t.p[1],C=t.p[2],
    		c=A.distanceTo(B),
    		a=C.distanceTo(B),
    		b=A.distanceTo(C),
    		u=a+b+c,
    		s=u/2
    	t.path.setAttribute("d","M"+A+" L"+B+" L"+C+"Z"),
    	t.gravityPoint.x=(A.x+B.x+C.x)/3,
    	t.gravityPoint.y=(A.y+B.y+C.y)/3,
    	attribs(t.innerCircle,{
    		"cx":(t.innerPoint.x=Math.round((a*A.x+b*B.x+c*C.x)/u)|0),
    		"cy":(t.innerPoint.y=Math.round((a*A.y+b*B.y+c*C.y)/u)|0),
    		"r" :Q((s-a)*(s-b)*(s-c)/s)
    	})
    	D=(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y))*2

    	t.circumPoint.x=Math.round(((A.x*A.x+A.y*A.y)*(B.y-C.y)+
    	                            (B.x*B.x+B.y*B.y)*(C.y-A.y)+
    	                            (C.x*C.x+C.y*C.y)*(A.y-B.y))/D)|0
    	t.circumPoint.y=Math.round(((A.x*A.x+A.y*A.y)*(C.x-B.x)+
    			                    (B.x*B.x+B.y*B.y)*(A.x-C.x)+
    			                    (C.x*C.x+C.y*C.y)*(B.x-A.x))/D)|0
    	var p = Q((a+b+c)*(a+b-c)*(a-b+c)*(-a+b+c))
    	attribs(t.circumCircle,{
    		"cx":t.circumPoint.x,
    		"cy":t.circumPoint.y,
    		"r" :Math.round(a*b*c/p)
    	})
    }

    function init() {
        let containerElement = document.getElementById('container');

        svg = makeSVG(containerElement, 'svg', {id:"svgElement"});
        svg.setAttribute('width', canvas.w);
        svg.setAttribute('height', canvas.h);

        let t = Triangle()
    }

    // Declare here public functions and constants (the items not declared here are private)
    return {
        init: init,
        addTriangle: Triangle
    };
})();
