const arrow = (startElement, finishElement, align, line_height, scrollOffsetXY) => {
  let scrollX = 0;
  let scrollY = 0;
  //when scrolling, offset needs to be considered
  if(scrollOffsetXY !== null){
    scrollX = scrollOffsetXY[0];
    scrollY = scrollOffsetXY[1];
  }

  let startBlock = startElement.getBoundingClientRect();
  let finishBlock = finishElement.getBoundingClientRect();
  let maxBlockHeight = (document.querySelector(".svg-container div")).getBoundingClientRect()[align];
  let arrowContainer = document.querySelector("#arrow");
  console.log(startBlock.x);
  let svgArrow = document.querySelector("#arrow path");
  svgArrow.setAttribute("class", align);

  let params = {
    line_height,
    line_start: startBlock.bottom + scrollY,
    line1: 30,
    line3: 5,
    arrow1: - 5,
    arrow2: - 10,
    arrow3: 5,
    line_finish: finishBlock.bottom + scrollY
  };

  if(align === "top"){
    params = {
      line_height,
      line_start: startBlock.top - 15 + scrollY,
      line1: - 35,
      line3: - 5,
      arrow1: 5,
      arrow2: 10,
      arrow3: - 5,
      line_finish: finishBlock.top - 15 + scrollY
    }
  }

//ARROW LINE PATH---------------------------------------------------------------------

  let _svgArrowLine = svgArrow.cloneNode(true);

  let start_x = (startBlock.x + scrollX + startBlock.width * 0.75).toString();
  let start_y = (params.line_start).toString();
  let start = arrowHandler(start_x, start_y, "M");

  let line1_x = start_x;
  let line1_y = (maxBlockHeight + scrollY + params.line1 + params.line_height).toString();
  let line1 = arrowHandler(line1_x, line1_y);

  let line2_x = (finishBlock.x + scrollX + finishBlock.width * 0.85).toString();
  let line2_y = line1_y;
  let line2 = arrowHandler(line2_x, line2_y);

  let line3_x = line2_x;
  let line3_y = (params.line_finish + params.line3).toString();
  let line3 = arrowHandler(line3_x, line3_y);

  let linePath = start + line1 + line2 + line3;

  _svgArrowLine.setAttribute("d", linePath);
  _svgArrowLine.setAttribute("stroke-dasharray", "5, 5");
  arrowContainer.appendChild(_svgArrowLine);

//ARROW HEAD PATH---------------------------------------------------------------------

  let _svgArrowHead = svgArrow.cloneNode(true);

  let arrowHeadStart = arrowHandler(line3_x, line3_y, "M");
  let arrowHead1 = arrowHandler((parseInt(line3_x) + params.arrow1).toString(), (line3_y).toString());
  let arrowHead2 = arrowHandler((line3_x).toString(), (parseInt(line3_y) + params.arrow2).toString());
  let arrowHead3 = arrowHandler((parseInt(line3_x) + params.arrow3).toString(), (line3_y).toString());
  let arrowHead4 = arrowHandler((line3_x).toString(), (line3_y).toString());

  let arrowHeadPath = arrowHeadStart + arrowHead1 + arrowHead2 + arrowHead3 + arrowHead4;

  _svgArrowHead.setAttribute("d", arrowHeadPath);
  _svgArrowHead.setAttribute("fill", "white");
  arrowContainer.appendChild(_svgArrowHead);
}

const arrowHandler = (x, y, d = "L") => {
  return d + x + " " + y + " ";
};
