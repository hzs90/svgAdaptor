$.getJSON("example_workflow.json", (json) => {
    svg(json);
});

const svg = (json, scrollOffsetXY = null) => {
  //remove tab elements
  json = json.filter(block => block.type !== "tab");
  //reorganizing json to follow blocks from start to end
  json = reorganize(json);

  let blockArray = []; //blocks will be added in an array first, then rendered to the DOM
  let container = document.querySelector(".svg-container");
  let lastElement = undefined;

  //rerender svg when user zooms in/out to keep the positions of the linearrows
  let body = document.querySelector("body");
  body.onresize = () => {
    let scrollOffsetXY = [window.scrollX, window.scrollY];
    container.innerHTML = '';
    document.getElementById("arrow").innerHTML = '<path d="M0 0 H0 0" fill="none" stroke="white"/>'
    svg(json, scrollOffsetXY);
  }

  // body.onscroll = () => {
  //   let scrollOffsetXY = [window.scrollX, window.scrollY];
  //   container.innerHTML = '';
  //   document.getElementById("arrow").innerHTML = '<path d="M0 0 H0 0" fill="none" stroke="white"/>'
  //   svg(json, scrollOffsetXY);
  // }

  json.forEach((block, idx) => {
    let init = document.querySelector("#init");
    let clone = init.cloneNode(true);
    let content = clone.querySelector("text"); //temporary (in the future icon shall be used)
    let element = document.createElement("div");
    element.id += block.id.toLowerCase(); //add block's ID to div
    element.setAttribute("data-num", blockArray.length);
    clone.style.display = "block";
    content.innerHTML = block.name || block.type;

    //check if block is a parallel switch, or a loop
    if (block.wires.length > 1) {
      if(parallelCheck(json, block.wires, block.id, idx)){
        clone.setAttribute("class", "parallel");
      } else if (checkInputs(json, block.id).length > 1 ){
        clone.setAttribute("class", "loop");
      }
    }

    //additional check for loops
    if(clone.getAttribute("class") !== "loop" && block.type !== "join" && block.type !== "switch"){
      let inputs = checkInputs(json, block.id);
      inputs.forEach((input) => {
        let element = (json.filter(block => block.id === input)[0]);
        if((json.indexOf(block) - json.indexOf(element)) < -1){
          clone.setAttribute("class", "loop");
        }
      })
    }

    //update block size if its a "join"
    if (block.type === "join"){
      let inputs = checkInputs(json, block.id);
      clone.setAttribute("height", inputs.length * clone.getAttribute("height"));
      clone.setAttribute("width", clone.getAttribute("width") / inputs.length);
    }

    element.appendChild(clone);
    blockArray.push(element);

    if (block.type === "switch"){
      let block_container = document.createElement("div");
      let wires = [];
      block.wires.forEach(wire => wires.push(wire));
      block_container.id = "block-wrapper";
      block_container.setAttribute("data-elements", wires);
      blockArray.push(block_container);
    }

    //if the last element (end) is not the last element of the array, the workflow has a loop.
    //put the element at the end of the workflow, and separate it from the others
    if (block.wires.length === 0 && json.length >= json.indexOf(block)){
      element.setAttribute("class", "last-element");
      lastElement = element;
      blockArray.splice(blockArray.indexOf(block), 1);
    }
  });

  //add last element to the end of the workflow
  if(lastElement !== undefined){
    lastElement.setAttribute("data-num", blockArray.length);
    blockArray.push(lastElement);
  }

  //wrap parallel svg-s into one div, so they will appear underneath of each other
  blockArray.forEach((block, idx) => {
    if (block.id === "block-wrapper"){
      let ids = block.dataset.elements.split(',');
      restructure(ids, blockArray, block);
    }
  })

  //rendering each blocks to DOM
  blockArray.forEach(e => container.appendChild(e));

  //adjust the height of parallel blocks
  let parallels = document.querySelectorAll(".parallel");
  parallels.forEach((element) => {
    let parent = element.parentNode;
    console.log(parent);
    element.setAttribute("height", element.getAttribute("height") * 2);
  })

  //add line arrows (./arrow.js)
  let loops_svg = document.querySelectorAll(".loop");
  let line_height = 0;

  loops_svg.forEach((loop) => {
    let loop_div = loop.parentNode;
    let currentLoop = document.getElementById(loop_div.id);
    let currentLoop_svg = currentLoop.querySelector("svg");
    json.forEach((element) => {
      if(element.wires){
        element.wires.forEach((wire) => {
          let elementInputs = checkInputs(json, element.id);
          if(wire[0] === currentLoop.id){
            let target = document.getElementById(element.id);
            let target_num = target.getAttribute("data-num");
            let target_svg = target.querySelector("svg");
            let loop_num = currentLoop.getAttribute("data-num");
            if(elementInputs.indexOf(currentLoop.id) !== -1){
              if(target_num < loop_num){
                //creating arrow (./arrow.js)
                arrow(currentLoop_svg, target_svg, "bottom", line_height, scrollOffsetXY);
                //line_height -= 10; //add different line heights for each arrowline
              }
            } else if (Math.abs(loop_num - target_num) > 1){
              arrow(target_svg, currentLoop_svg, "bottom", line_height, scrollOffsetXY);
              //line_height -= 10; //add different line heights for each arrowline
            }
          }
        });
      }
    });
  });

  //taking care of connecting the last element according to the wires (only required when the wired block is not a neighbour of the last element)
  if(lastElement !== undefined){
    let connect = checkInputs(json, lastElement.id);
    connect.forEach((id) => {
      let startElement = document.getElementById(id);
      arrow(startElement, lastElement, "top", line_height, scrollOffsetXY);
    });

  }
}

//check if its a parallel block/sequence, or a loop
const parallelCheck = (json, wires, currentId, blockIdx) => {

  let outputs = [];
  let _json = [];
  let parallel = true;
  wires.forEach(wire => outputs.push(wire[0]));
  outputs.forEach((output) => {
    _json.push(json.filter(block => block.id === output)[0]);
  });
  _json.forEach((element, idx) => {
    if(element.wires.length > 0){
      element.wires.forEach((wire) => {
        if(wire[0] === currentId){
          parallel = false;
        }
      })
      if (json.indexOf(_json[idx]) <= blockIdx){
        parallel = false;
      }
    }
  })
  return parallel;
}

const checkInputs = (json, id) => {
    let inputs = [];
    json.forEach((block, idx) => {
      block.wires.forEach((wire) => {
        if(wire[0] === id) {
          inputs.push(block.id.toLowerCase());
        }
      })
    })
    return inputs;
}

//reorganize the original json before processing
const reorganize = (json) => {
  //search for first block (no inputs)
  let first_block = json.filter((block) => {
    if(checkInputs(json, block.id).length === 0){
      return true;
    }
  });

  json.splice(json.indexOf(first_block[0]), 1); //remove the first block from the actual index
  json.unshift(first_block[0]); //add the first block to the very first index

  let new_json = [];

  newStruct(json[0]);

  function newStruct(element) {
    new_json.push(element);
    if(element.wires.length > 0 && element.wires[0].length > 0 && new_json.length < json.length){
      element.wires.forEach((wire) => {
        let next = json.filter(block => block.id === wire[0])[0];
        if(new_json.length <= json.length && new_json.indexOf(next) < 0){
          newStruct(next);
        }
      })
    }
  }
  return new_json;
}

//restructure parallel blocks, so they will appear underneath of each other
const restructure = (ids, blockArray, block) => {
  ids.forEach((id, idx) => {
    let element = blockArray.filter(block => block.id === id)[0];
    let _element = element.cloneNode(true);
    //resize element height (if parallel class is added previously)
    let _element_svg = _element.querySelector("svg");
    if(_element_svg.className.baseVal === "parallel"){
      _element_svg.setAttribute("height", _element_svg.getAttribute("height") / ids.length);
    }

    _element.setAttribute("data-row", idx+1);
    block.appendChild(_element);
    blockArray.splice(blockArray.indexOf(element), 1);
  });
}
