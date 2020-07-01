function assemble(mipsCode: string, isDebug: boolean = true): string {
    let res = '';
    const lines = mipsCode.trim().split('\n');
    let insList = [];
    let labelList = {};
    let pendingLabel = '';
    for (let i = 0, len = lines.length; i < len; i++) {
        // Remove '//' comments
        let j = lines[i].search('//');
        if (j >= 0) {
            lines[i] = lines[i].slice(0, j);
        }
        // Remove '#' comments
        j = lines[i].search('#')
        if (j >= 0) {
            lines[i] = lines[i].slice(0, j);
        }
        let singleLine = lines[i].replace(/:/g, ':;').split(';');
        for (let k = 0, _len = singleLine.length; k < _len; k++) {
            if (singleLine[k][singleLine[k].length - 1] === ':') { // label
                if (pendingLabel === '') {
                    let currentLabel = singleLine[k].replace(':', ' ').trim();
                    if (!isNaN(parseInt(currentLabel))) { // starts with number
                        throw new ParseError(i + 1, 'Illegal label: Label: ' + currentLabel);
                    } else if (labelList[currentLabel] === undefined) {
                        pendingLabel = currentLabel;
                    } else {
                        throw new ParseError(i + 1, 'Label already defined: Label: ' + currentLabel +
                            ', old address: ' + (labelList[currentLabel] * 4).toString() + ', new address: ' + (insList.length * 4).toString());
                    }
                } else { // has pending label
                    throw new ParseError(i + 1, 'Multiple pending label: Pending label: ' + pendingLabel +
                        ', new label: ' + singleLine[k].replace(':', ' ').trim());
                }
            } else { // instruction
                let singleIns = singleLine[k].replace(/,/g, ' ').replace(/\(/g, ' ')
                    .replace(/\)/g, ' ').trim().split(/\s+/);
                if (singleIns.length === 1 && singleIns[0] === "") continue; // ignore comment or empty line
                singleIns.push(i); // push line number for error result
                insList.push(singleIns);
                if (pendingLabel !== '') {
                    labelList[pendingLabel] = insList.length - 1;
                    pendingLabel = '';
                }
            }
        }
    }
    if (isDebug) {
        res += "Debug:\n";
    } else {
        res += "memory_initialization_radix=16;\nmemory_initialization_vector=\n";
    }
    try {
        res += parse(insList, !isDebug, labelList);
    } catch (err) {
        throw err;
    }
    return res;
}

const op_set = {
    // R-type
    'add': R_basic, 'addu': R_basic, 'sub': R_basic, 'subu': R_basic, 'and': R_basic, 'or': R_basic, 'xor': R_basic,
    'nor': R_basic, 'slt': R_basic, 'sltu': R_basic, 'sllv': R_basic, 'srlv': R_basic, 'srav': R_basic,
    'sll': R_plus, 'srl': R_plus, 'sra': R_plus, 'jr': R_jr,
    // I-type
    'addi': I_basic, 'addiu': I_basic, 'andi': I_basic, 'ori': I_basic, 'xori': I_basic, 'slti': I_basic, 'sltiu': I_basic,
    'beq': I_basic, 'bne': I_basic, 'lw': I_mem, 'sw': I_mem, 'lui': I_lui,
    // J-type
    'j': J_basic, 'jal': J_basic
};

const reg = {
    '$zero': "00000", '$at': "00001", '$v0': "00010", '$v1': "00011", '$a0': "00100", '$a1': "00101", '$a2': "00110",
    '$a3': "00111", '$t0': "01000", '$t1': "01001", '$t2': "01010", '$t3': "01011", '$t4': "01100", '$t5': "01101",
    '$t6': "01110", '$t7': "01111", '$s0': "10000", '$s1': "10001", '$s2': "10010", '$s3': "10011", '$s4': "10100",
    '$s5': "10101", '$s6': "10110", '$s7': "10111", '$t8': "11000", '$t9': "11001", '$k0': "11010", '$k1': "11011",
    '$gp': "11100", '$sp': "11101", '$fp': "11110", '$ra': "11111"
};

function parse(ins: Array, isHex: boolean = true, labelList: JSON = {}): string {
    let res = "";
    for (let i = 0, len = ins.length; i < len; i++) {
        const curLine = ins[i][ins[i].length - 1] + 1;
        try {
            ins[i][ins[i].length - 1] = i; // change last element from lineNum to insNum
            let ins_code = op_set[ins[i][0]](ins[i], labelList);
            if (isHex) { // to Hex
                res += ('00000000' + ins_code.toString(16).toUpperCase()).slice(-8);
                if (i !== len - 1) {
                    res += ", ";
                    if (i % 8 === 7) {
                        res += "\n";
                    }
                } else {
                    res += ";";
                }
            } else { // to Binary
                res += i.toString() + ": " + ('00000000000000000000000000000000' +
                    ins_code.toString(2)).slice(-32) + "\n";
            }
        } catch (err) {
            if (err.name === 'TypeError') {
                throw new ParseError(curLine, "no such instruction '" + ins[i][0] + "'");
            } else {
                throw new ParseError(curLine, err.message);
            }
        }
    }
    return res;
}

function R_basic(ops: Array): number {
    if (ops.length !== 5) { // ins rs, rt, rd, ins-num
        throw Error("R-type instruction `" + ops[0] + "` needs rs, rt, rd");
    }
    let regs = [];
    for (let i = 1; i < 4; i++) {
        regs.push(reg[ops[i]]);
        if (regs[i - 1] === undefined) {
            throw Error("Register '" + ops[i] + "' not exist");
        }
    }
    const funcCodes = {
        'add': '100000',
        'addu': '100001',
        'sub': '100010',
        'subu': '100011',
        'and': '100100',
        'or': '100101',
        'xor': '100110',
        'nor': '100111',
        'slt': '101010',
        'sltu': '101011',
        'sllv': '000100',
        'srlv': '000110',
        'srav': '000111'
    };
    const op = '000000', sh_amt = '00000', func = funcCodes[ops[0]];
    return parseInt(op + regs[1] + regs[2] + regs[0] + sh_amt + func, 2);
}

function R_plus(ops: Array): number {
    if (ops.length !== 5) { // ins rs, rt, shamt, ins-num
        throw Error("R-type instruction `" + ops[0] + "` needs rs, rt, rd");
    }
    let regs = [];
    for (let i = 1; i < 3; i++) {
        regs.push(reg[ops[i]]);
        if (regs[i - 1] === undefined) {
            throw Error("Register '" + ops[i] + "' not exist");
        }
    }
    const funcCodes = {
        'sll': '000000', 'srl': '000010', 'sra': '000011'
    };
    const func = funcCodes[ops[0]];
    const immediate = parseInt(ops[3]);
    if (immediate > 31 || immediate < 0) {
        throw Error('Illegal operand: Shift amount length out of range');
    }
    const shamt = ('00000' + immediate.toString(2)).slice(-5);
    return parseInt('00000000000' + regs[1] + regs[0] + shamt + func, 2);
}

function R_jr(ops: Array): number {
    if (ops.length !== 3) { // jr rs ins-num
        throw Error("I-type instruction `" + ops[0] + "` needs rs");
    }
    const rs = reg[ops[1]];
    if (rs === undefined) {
        throw Error("Register '" + ops[1] + "' not exist");
    }
    return parseInt("000000" + rs + "000000000000000001000", 2);
}

function I_basic(ops: Array, labelList: JSON): number {
    if (ops.length !== 5) { // ins rs, rt, immediate, ins-num
        throw Error("I-type instruction `" + ops[0] + "` needs rs, rt, imm");
    }
    const opCodes = {
        'addi': '001000',
        'addiu': '001001',
        'andi': '001100',
        'ori': '001110',
        'xori': '001110',
        'slti': '001010',
        'sltiu': '001011',
        'beq': '000100',
        'bne': '000101'
    };
    const op = opCodes[ops[0]];
    let regs = [];
    for (let i = 1; i < 3; i++) {
        regs.push(reg[ops[i]]);
        if (regs[i - 1] === undefined) {
            throw Error("Register '" + ops[i] + "' not exist");
        }
    }
    let immediate = parseInt(ops[3]);
    if (isNaN(immediate)) { // must be a label
        immediate = labelList[ops[3]] - ops[4] - 1; // pc + 4 + offset * 4
        if (isNaN(immediate)) { // no such label
            throw Error("Undefined label: Label name: " + ops[3]);
        }
    }
    let imm = '';
    if (immediate >= 0 && immediate <= 65535) {
        imm = ('0000000000000000' + immediate.toString(2)).slice(-16);
    } else if (immediate <= 0 && immediate >= -32768) {
        imm = ((-1 - immediate) ^ (2 ** 16 - 1)).toString(2);
    } else {
        throw Error('Illegal operand: Immediate length too long');
    }
    return parseInt(op + regs[1] + regs[0] + imm, 2);
}

function I_mem(ops: Array): number {
    if (ops.length !== 5) { // ins rs rt imm ins-num
        throw Error("I-type instruction `" + ops[0] + "` needs rs, rt, immediate");
    }
    const opCodes = {
        'lw': '100011',
        'sw': '101011'
    }
    const op = opCodes[ops[0]];
    const rs = reg[ops[3]];
    if (rs === undefined) {
        throw Error("Register '" + ops[3] + "' not exist");
    }
    const rt = reg[ops[1]];
    if (rt === undefined) {
        throw Error("Register '" + ops[1] + "' not exist");
    }
    let imm = '', immediate = parseInt(ops[2]);
    if (immediate >= 0 && immediate <= 65535) {
        imm = ('0000000000000000' + immediate.toString(2)).slice(-16);
    } else if (immediate <= 0 && immediate >= -32768) {
        imm = ((-1 - immediate) ^ (2 ** 16 - 1)).toString(2);
    } else {
        throw Error('Illegal operand: Immediate length too long');
    }
    return parseInt(op + rs + rt + imm, 2);
}

function I_lui(ops: Array): number {
    if (ops.length !== 4) { // lui rt imm ins-num
        throw Error("I-type instruction `" + ops[0] + "` needs rt, immediate");
    }
    const rt = reg[ops[1]];
    if (rt === undefined) {
        throw Error("Register '" + ops[1] + "' not exist");
    }
    let imm = '', immediate = parseInt(ops[2]);
    if (immediate >= 0 && immediate <= 65535) {
        imm = ('0000000000000000' + immediate.toString(2)).slice(-16);
    } else if (immediate <= 0 && immediate >= -32768) {
        imm = ((-1 - immediate) ^ (2 ** 16 - 1)).toString(2);
    } else {
        throw Error('Illegal operand: Immediate length too long');
    }
    return parseInt('00111100000' + rt + imm, 2);
}

function J_basic(ops: Array, labelList: JSON):number {
    if (ops.length !== 3) { // ins addr ins-num
        throw Error("J-type instruction `" + ops[0] + "` needs address");
    }
    const opCodes = {
        'j': '000010',
        'jal': '000011'
    }
    const op = opCodes[ops[0]];
    let immediate = parseInt(ops[1]);
    if (isNaN(immediate)) { // must be a label
        immediate = labelList[ops[1]];
        if (isNaN(immediate)) { // no such label
            throw Error("Undefined label: Label name: " + ops[1]);
        } else if (immediate.toString(2).slice(0, 4) === ops[2].toString(2).slice(0, 4)) {
            // The upper 4 bits of the current PC register should be the same as the label's address's upper 4 bits
            // throw Error("Label " + ops[1] + " out of range");
        }
    }
    let addr = '';
    if (immediate >= 0 && immediate <= 67108863) {
        addr = ('00000000000000000000000000' + immediate.toString(2)).slice(-26);
    } else {
        throw Error('Illegal address: address ' + ops[1] + ' out of range');
    }
    return parseInt(op + addr, 2);
}

class ParseError extends Error {
    constructor(lineNum: number, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError);
        }

        this.name = 'ParseError';
        // Custom debugging information
        this.lineNum = lineNum;
    }
}

// module.exports = {
//     assemble
// }

export default assemble;