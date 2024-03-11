// This file holds the main code for the plugin. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

figma.ui.resize(400, 400);

class PluginError {
    message: string = '';
    constructor(msg: string) {
        this.message = msg;
    }
}

// removes spaces and non alphanumeric characters from names
const cleanString = (str: string): string => {
    let s = str.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '_');
    // prepends a _ if the name begins with a number
    if (/^[0-9]/.test(s)) {
        s = '_' + s;
    }
    return s;
};

// Checks whether or not to skip a node by its name
const isNameValid = (name: string): boolean => !name.startsWith('_');

const numberToFloatString = (num: number): string => (num % 1 == 0 ? `${num}.0f` : `${num}f`);

const FIGMABOUNDSHEADER_H = `#pragma once
#include <array>\n\n`;

function clone(val : any) {
    return JSON.parse(JSON.stringify(val))
}


interface Component {
    name: string;
    children : Array<Component>
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    r?: number;
    g?: number;
    b?: number;
}

function generate() {
    let jsonContent = "";


    let dict = {}
    const parseBoundsRecursive = (parent: Component, node: SceneNode): void => {
        const bounds: Array<number> = [node.x, node.y, node.width, node.height];


        const x = numberToFloatString(node.x);
        const y = numberToFloatString(node.y);
        const w = numberToFloatString(node.width);
        const h = numberToFloatString(node.height);

        let r = 0;
        let g = 0;
        let b = 0;

        if ('fills' in node) {
            const fills = clone(node.fills)
            r = fills[0].color.r;
            g = fills[0].color.g;
            b = fills[0].color.b;

        }

        let c : Component = {
            name : node.name, 
            x : node.x, 
            y : node.y, 
            w : node.width,
            h : node.height,
            r : r,
            g : g,
            b : b,
            children : []
        };

        parent.children.push(c);
        
        if ('children' in node) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];

                if (!isNameValid(child.name)) continue;
                parseBoundsRecursive(c, child);
            }
        }
    };

    const { selection } = figma.currentPage;
    if (selection.length === 0) {
        throw new PluginError('You must select at least 1 node/group!');
    }
    for (let [idx, sceneNode] of selection.entries()) {
        let root : Component = {
            name : "root", 
            children : []
        };

        parseBoundsRecursive(root, sceneNode);
        jsonContent += JSON.stringify(root, null, 2);
    }
    const text = jsonContent;
    console.log(text);
    // figma.ui.postMessage({ type: 'saveText', payload: text });
}


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.

    try {
        // throw new PluginError('ayylmao');
        if (msg.type === 'generate') {
            generate();
        }
    } catch (err) {
        if (err instanceof PluginError) {
            figma.ui.postMessage({ type: 'error', payload: err.message });
        }
    }

    
    if (msg.type === 'cancel') {
        // Make sure to close the plugin when you're done. Otherwise the plugin will
        // keep running, which shows the cancel button at the bottom of the screen.
        figma.closePlugin();
    }
};
