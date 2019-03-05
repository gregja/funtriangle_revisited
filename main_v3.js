/*
* version finale avec utilisation des ronds rouges en svg (tout fonctionne)
*/
var trianglefunModule = (function () {
    "use strict";

    var containerElement, canvasElement, svgElement, ctx;

    const R = Math.random;
    const Q = Math.sqrt
    const TWO_PI = 2 * Math.PI;
  
    var shapes = [];
    var mousePos = {x:0, y:0};
	var dragMode = false;
	var shapeMoved = null;  // shape selected when dragMode is true
	var ballChosen = null;  // ball selected when dragMode is true
	var rayon = 13; 

    let canvas = {w : window.innerWidth, h : window.innerHeight};

    // save the current picture
    function saveImage(el) {       
        var image = canvasElement.toDataURL("image/png");
        el.href = image;
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

				case 'red-ball': {
				  mode = 'fill';
					fillColor = 'red';
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

    function Point(x,y){
        var t=this;
        if(!(this instanceof Point)) return new Point(x,y);

        t.x=isNaN(x)?(R()*canvas.w)|0:x
        t.y=isNaN(y)?(R()*canvas.h)|0:y
    }

    Point.prototype.distanceTo = function(P,dx,dy) {
        dx=P.x-this.x;
        dy=P.y-this.y;
        return Q(dx*dx+dy*dy);
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
        t.p=[A,B,C];
        for(let i=3;i--;){
            if(t.p[i] instanceof Point) continue
            if(t.p[i] instanceof Array) {
                t.p[i]=Point(t.p[i][0],t.p[i][1])
            } else {
                t.p[i]=Point()
            }
        }

        updateAll()
    }

    Triangle.prototype.update=function(){

        //      C
        //     / \
        //   b/   \a
        //   /     \
        //  A-------B
        //      c
        var t=this;
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

        let D = (A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y))*2;

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

        for(let i=3;i--;){
			draw("circle",{
			  "class":"red-ball",
			  "cx":t.p[i].x,
			  "cy":t.p[i].y,
			  "r" :rayon
			})
        }
    }

    function updateAll(){
      clearCanvas();
      shapes.forEach(triangle => { triangle.update() });
    }
  
    function clearCanvas() {
        ctx.fillStyle = "#333";
        ctx.fillRect(0,0,canvasElement.width, canvasElement.height);
    }

	function findTriangleSelected() {
		shapeMoved = null;
		ballChosen = null;
		for (let i=0, imax=shapes.length; i<imax && shapeMoved == null; i++) {
			let shape = shapes[i];
			for(let j=3;j--;){
				let redball = shape.p[j];
				let distX = mousePos.x - redball.x;
				let distY = mousePos.y - redball.y;
				let distance = Math.sqrt( (distX*distX) + (distY*distY) );
				if (distance <= rayon) {
					shapeMoved = shape;
					ballChosen = j;
					break;
				}
			}
		}
		return true;
	}
	
    function getMousePos(evt) {
        var rect = canvasElement.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    function getTouchPos(evt) {
        var rect = canvasElement.getBoundingClientRect();
        return {
            x: evt.touches[0].clientX - rect.left,
            y: evt.touches[0].clientY - rect.top
        };
    }
	
    function init() {
        let containerElement = document.getElementById('container');

        canvasElement = document.createElement('canvas');
        canvasElement.setAttribute('id','canvasElement');
        containerElement.appendChild(canvasElement);

        //report the mouse position on click
		canvasElement.addEventListener("mousedown",function(evt){
			mousePos = getMousePos(evt);
			findTriangleSelected();
		    if (shapeMoved != null) {
				dragMode = true;
			}
		})
		canvasElement.addEventListener("mousemove",function(evt){
			if(dragMode) {
				mousePos = getMousePos(evt);
				let t = shapeMoved.p[ballChosen];
				t.x = mousePos.x;
				t.y = mousePos.y;
				updateAll();
			}
		})
		canvasElement.addEventListener("mouseup",function(){
			dragMode = false;
		})
		
		canvasElement.addEventListener("touchstart",function(evt){
			mousePos = getTouchPos(evt);
			findTriangleSelected();
		    if (shapeMoved != null) {
				dragMode = true;
			}
		})
		canvasElement.addEventListener("touchmove",function(evt){
			if(dragMode) {
				mousePos = getTouchPos(evt);
				let t = shapeMoved.p[ballChosen];
				t.x = mousePos.x;
				t.y = mousePos.y;
				updateAll();
			}
		})
		canvasElement.addEventListener("touchend",function(e){
			dragMode=false
		})
      
      
        ctx = canvasElement.getContext('2d');

        containerElement.style.width = canvas.w+'px';
        containerElement.style.height = canvas.h+'px';
        canvasElement.width = canvas.w;
        canvasElement.height = canvas.h;

        addTriangle();
    }

    function addTriangle() {
        let t = Triangle();
        shapes.push(t);   
        updateAll();
    }
  
    // Declare here public functions and constants (the items not declared here are private)
    return {
        init: init,
        addTriangle: addTriangle,
        saveImage: saveImage
    };
})();
