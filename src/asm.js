function assemble(mipsCode: string, isDebug: boolean = true): string {
    let res = '';
    const lines = mipsCode.trim().split('\n');
    let ins_list = [];
    for (let i = 0, len = lines.length; i < len; i++) {
        // Remove '//' comments
        let j = lines[i].search('//')
        if (j >= 0) {
            lines[i] = lines[i].slice(0, j);
        }
        // Remove '#' comments
        j = lines[i].search('#')
        if (j >= 0) {
            lines[i] = lines[i].slice(0, j);
        }
        let temp = lines[i].replace(/,/g, ' ').replace(/;/g, ' ');
        // console.log(temp)
        temp = temp.trim().split(/\s+/);
        // ignore comment line
        if (temp.length === 1 && temp[0] === "") continue;
        temp.push(i) // push line number for error result
        ins_list.push(temp);
    }
    if (isDebug) {
        res += "Debug:\n";
    } else {
        res += "memory_initialization_radix=16;\nmemory_initialization_vector=\n";
    }
    try {
        res += parse(ins_list, !isDebug);
    } catch (err) {
        throw err;
    }
    return res;
}

const op_set = {
    // R-type
    'add': R_basic, 'addu': R_basic, 'sub': R_basic, 'subu': R_basic, 'and': R_basic, 'or': R_basic, 'xor': R_basic,
    'nor': R_basic, 'slt': R_basic, 'sltu': R_basic, 'sllv': R_basic, 'srlv': R_basic, 'srav': R_basic,
    'sll': R_plus, 'srl': R_plus, 'sra': R_plus,
    // I-type
    'addi': I_type, 'addiu': I_type, 'andi': I_type, 'ori': I_type, 'xori': I_type, 'slti': I_type, 'sltiu': I_type,
};

// 'lw':Lw,'sw':Sw,'j':J, 'jr':Jr,'jal':Jal,'beq':Beq,'bne':Bne,

const reg = {
    '$zero': "00000", '$at': "00001", '$v0': "00010", '$v1': "00011", '$a0': "00100", '$a1': "00101", '$a2': "00110",
    '$a3': "00111", '$t0': "01000", '$t1': "01001", '$t2': "01010", '$t3': "01011", '$t4': "01100", '$t5': "01101",
    '$t6': "01110", '$t7': "01111", '$s0': "10000", '$s1': "10001", '$s2': "10010", '$s3': "10011", '$s4': "10100",
    '$s5': "10101", '$s6': "10110", '$s7': "10111", '$t8': "11000", '$t9': "11001", '$k0': "11010", '$k1': "11011",
    '$gp': "11100", '$sp': "11101", '$fp': "11110", '$ra': "11111"
};

function parse(ins: Array, isHex: boolean = true): string {
    let res = "";
    for (let i = 0, len = ins.length; i < len; i++) {
        try {
            let ins_code = op_set[ins[i][0]](ins[i]);
            if (isHex) {
                res += ('00000000' + ins_code.toString(16).toUpperCase()).slice(-8);
                if (i !== len - 1) {
                    res += ", ";
                    if (i % 8 === 7) {
                        res += "\n";
                    }
                } else {
                    res += ";";
                }
            } else { // is Binary
                res += i.toString() + ": " + ('00000000000000000000000000000000' +
                    ins_code.toString(2)).slice(-32) + "\n";
            }
        } catch (err) {
            if (err.name === 'TypeError') {
                throw new ParseError(ins[i][ins[i].length - 1] + 1, "no such instruction '" + ins[i][0] + "'");
            } else {
                throw new ParseError(ins[i][ins[i].length - 1] + 1, err.message);
            }
        }
    }
    return res;
}

function R_basic(ops: Array): number {
    if (ops.length !== 5) { // ins rs, rt, rd, line-num
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
    if (ops.length !== 5) { // ins rs, rt, rd, line-num
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
    const sh_amt = ('00000' + immediate.toString(2)).slice(-5);
    return parseInt('00000000000' + regs[1] + regs[0] + sh_amt + func, 2);
}

function I_type(ops: Array):number {
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

module.exports = {
    assemble
}