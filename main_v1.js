/*
* Preliminary version with a function to backup the images, and the Canvas and SVG artefacts generated programmatically
* This version contains two major flaws:
* - the red balls are not drawn in the canvas
* - only the triangle "active" (being manipulated) is drawn, for the other triangles, only the red balls are visible
*
* Version préparatoire avec ajout fonction de sauvegarde des images, et génération du canvas et du svg par programmation
* Cette version contient deux défauts majeurs :
* - les boules rouges ne sont pas dessinées dans le canvas
* - seul le triangle "actif" (en cours de manipulation) est dessiné, pour les autres triangles, seules les boules rouges sont visibles
*
*/

var trianglefunModule = (function () {
    "use strict";

    var containerElement, canvasElement, svgElement, ctx;

    const w3="http://www.w3.org/"
    const svgNS=w3+"2000/svg"
    const xlinkNS=w3+"1999/xlink"
    const R = Math.random;
    const Q = Math.sqrt
    const TWO_PI = 2 * Math.PI;

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

    // save the current picture
    function saveImage(el) {
        var image = canvasElement.toDataURL("image/png");
        el.href = image;
    }

    function drawPoint(name, attrs) {
        el = document.createElementNS(svgNS, name)
        if(attrs) attribs(el, attrs)
        return el
    }

    function draw(name, attrs){

            let mode = 'stroke';
            let fillColor = '';
            let strokeColor = '';
            let strokeWidth = 1;
            if (attrs.class) {
                switch (attrs.class) {
                    case 'grav-point': {
                        mode = 'fill';
                    	fillColor = 'silver';
                        break;
                    }

                    case 'inner-point': {
                        mode = 'fill';
                	fillColor = 'salmon';
                        break;
                    }

                    case 'inner': {
                    	strokeWidth = 2;
                    	strokeColor = 'salmon';
                        break;
                    }

                    case 'circum-point': {
                        mode = 'fill';
                    	fillColor = 'lawngreen';
                        break;
                    }

                    case 'circum': {
                    	strokeWidth = 2;
                    	strokeColor = 'lawngreen';
                        break;
                    }
                }
            }
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.arc(attrs.cx, attrs.cy, attrs.r, 0, TWO_PI, false);
            if (mode == 'fill') {
                ctx.fillStyle = fillColor;
                ctx.fill();
            } else {
                ctx.strokeWidth = strokeWidth;
                ctx.strokeStyle = strokeColor;
                ctx.stroke();
            }
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
        this.el = drawPoint("circle",{"class":role, "r":role=="draggable"?13:5});
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
        var t=this;
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

        var here = svg.querySelector('.draggable')

        t.update()
        for(let i=3;i--;)
            t.p[i].el.addEventListener("move", function(e){
                t.update()
            })
    }

    Triangle.prototype.update=function(){
        clearCanvas();
        //      C
        //     / \
        //   b/   \a
        //   /     \
        //  A-------B
        //      c
        var t=this,D;
        var A=t.p[0],B=t.p[1],C=t.p[2];
        var c=A.distanceTo(B),
            a=C.distanceTo(B),
            b=A.distanceTo(C);
        var u=a+b+c,
            s=u/2;

		ctx.beginPath();
		let xp = new Path2D();
		xp.moveTo(A.x, A.y);
		xp.lineTo(B.x, B.y);
		xp.lineTo(C.x, C.y);
		xp.lineTo(A.x, A.y);
		ctx.lineWidth = 4;
		ctx.strokeStyle = "white";
		ctx.stroke(xp);

        draw("circle",{
            "class":"grav-point",
            "cx":(A.x+B.x+C.x)/3,
            "cy":(A.y+B.y+C.y)/3,
            "r" :5
        })

        let innerPoint = {};
        innerPoint.x = Math.round((a*A.x+b*B.x+c*C.x)/u)|0;
        innerPoint.y = Math.round((a*A.y+b*B.y+c*C.y)/u)|0;

        draw("circle",{
            "class":"inner",
            "cx":innerPoint.x,
            "cy":innerPoint.y,
            "r" :Q((s-a)*(s-b)*(s-c)/s)
        });

        draw("circle",{
            "class":"inner-point",
            "cx":innerPoint.x,
            "cy":innerPoint.y,
            "r" :5
        });

        D=(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y))*2;

        draw("circle",{
            "class":"circum-point",
            "cx":Math.round(((A.x*A.x+A.y*A.y)*(B.y-C.y)+
                                        (B.x*B.x+B.y*B.y)*(C.y-A.y)+
                                        (C.x*C.x+C.y*C.y)*(A.y-B.y))/D)|0,
            "cy":Math.round(((A.x*A.x+A.y*A.y)*(C.x-B.x)+
                                        (B.x*B.x+B.y*B.y)*(A.x-C.x)+
                                        (C.x*C.x+C.y*C.y)*(B.x-A.x))/D)|0,
            "r" :5
        })

        let circumPoint = {};
        circumPoint.x=Math.round(((A.x*A.x+A.y*A.y)*(B.y-C.y)+
                                    (B.x*B.x+B.y*B.y)*(C.y-A.y)+
                                    (C.x*C.x+C.y*C.y)*(A.y-B.y))/D)|0;
        circumPoint.y=Math.round(((A.x*A.x+A.y*A.y)*(C.x-B.x)+
                                    (B.x*B.x+B.y*B.y)*(A.x-C.x)+
                                    (C.x*C.x+C.y*C.y)*(B.x-A.x))/D)|0;

        var p = Q((a+b+c)*(a+b-c)*(a-b+c)*(-a+b+c));

        draw("circle",{
            "class":"circum",
            "cx":circumPoint.x,
            "cy":circumPoint.y,
            "r" :Math.round(a*b*c/p)
        })

        draw("circle",{
            "class":"circum-point",
            "cx":circumPoint.x,
            "cy":circumPoint.y,
            "r" :5
        })

    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    function init() {
        let containerElement = document.getElementById('container');

        canvasElement = document.createElement('canvas');
        canvasElement.setAttribute('id','canvasElement');
        containerElement.appendChild(canvasElement);

        ctx = canvasElement.getContext('2d');

        containerElement.style.width = canvas.w+'px';
        containerElement.style.height = canvas.h+'px';
        canvasElement.width = canvas.w;
        canvasElement.height = canvas.h;

        svg = makeSVG(containerElement, 'svg', {id:"svgElement"});
        svg.setAttribute('width', canvas.w);
        svg.setAttribute('height', canvas.h);
        svg.style.width =  canvas.w+'px';
        svg.style.height = canvas.h+'px';

        let t = Triangle()
    }

    // Declare here public functions and constants (the items not declared here are private)
    return {
        init: init,
        addTriangle: Triangle,
        saveImage: saveImage
    };
})();
