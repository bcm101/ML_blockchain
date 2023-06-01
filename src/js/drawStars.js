function drawStar(ctx, x, y, radius, spikes, innerRadius, percent) {

    let rot = (Math.PI / 2) * 3;
    let cx = x;
    let cy = y;
    let step = 2 * Math.PI / spikes;

    let fillTill =  x + 2 * (percent - .5) * radius; 
    let draw = true;

    let points = [];

    ctx.beginPath();
    ctx.moveTo(x, y - radius);

    let first = {x: x, y: y-radius};

    const calcIntersection = (first, second, x) => {
        let m = (first.y - second.y)/(first.x - second.x);
        let b = first.y - m * first.x;

        return m * x + b;
    }

    const drawByPoints = (points) => {
        ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y)
        for(let i = 0; i < points.length; i++){
            ctx.lineTo(points[i].x, points[i].y);
        }
    }

    for (let i = 0; i < spikes; i++) {
        let angle = rot + i * step;
        let x1 = cx + Math.cos(angle) * radius;
        let y1 = cy + Math.sin(angle) * radius;

        let x2 = cx + Math.cos(angle) * innerRadius;
        let y2 = cy + Math.sin(angle) * innerRadius;

        angle += step;

        if(x1 >= fillTill && !draw)
            ctx.moveTo(x1, y1);
        else if(x1 >= fillTill){
            draw = false;
            let intersection = calcIntersection(first, {x: x1, y: y1}, fillTill);
            points.push({x: fillTill, y: intersection});
        }else if(!draw){
            draw = true;
            let intersection = calcIntersection(first, {x: x1, y: y1}, fillTill);
            points.push({x: fillTill, y: intersection});                    
            points.push({x: x1, y: y1});
        }else{
            points.push({x: x1, y: y1});
        }
            

        if(x2 >= fillTill && !draw)
            ctx.moveTo(x2, y2);
        else if(x2 >= fillTill){
            draw = false;
            let intersection = calcIntersection({x: x1, y: y1}, {x: x2, y: y2}, fillTill);
            points.push({x: fillTill, y: intersection});
        }else if(!draw){
            draw = true;
            let intersection = calcIntersection({x: x1, y: y1}, {x: x2, y: y2}, fillTill);
            points.push({x: fillTill, y: intersection});
            points.push({x: x2, y: y2});
        }else{
            points.push({x: x2, y: y2});
        }
        
        first.x = x2;
        first.y = y2;


    }
    if(x > fillTill){
        let intersection = calcIntersection(first, {x: x, y: y - radius}, fillTill)
        points.push({x: fillTill, y: intersection});
    }else{
        points.push({x: x, y: y - radius});
    }
    
    drawByPoints(points);

    // if(percent < 1){
    //     ctx.moveTo(fillTill, y - radius);
    //     ctx.lineTo(fillTill, y + radius);
    // }

    ctx.closePath();
}

export function drawStars(ctx, x, y, radius, spikes, innerRadius, numStars, rating){
    let deltaX = radius * 2;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "gold";

    for(let i = 0; i < numStars; i++){
        drawStar(ctx, x += deltaX, y, radius, spikes, innerRadius, rating--);
        ctx.fill();
        ctx.stroke();
    }

}


