function assemble(mipsCode: string): string {
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
    res = parse(ins_list);
    return res;
}

const op_set = {'add': Add,};
// 'addi':Addi,'sub':Sub,'nor':Nor,'and':And,'andi':Andi,'or':Or,'ori':Ori,'lw':Lw,'sw':Sw,'j':J,
//     'jr':Jr,'jal':Jal,'beq':Beq,'bne':Bne,'sll':Sll,'srl':Srl,'slt':Slt,'slti':Slti

const reg = {
    '$zero': "00000", '$at': "00001", '$v0': "00010", '$v1': "00011", '$a0': "00100", '$a1': "00101", '$a2': "00110",
    '$a3': "00111", '$t0': "01000", '$t1': "01001", '$t2': "01010", '$t3': "01011", '$t4': "01100", '$t5': "01101",
    '$t6': "01110", '$t7': "01111", '$s0': "10000", '$s1': "10001", '$s2': "10010", '$s3': "10011", '$s4': "10100",
    '$s5': "10101", '$s6': "10110", '$s7': "10111", '$t8': "11000", '$t9': "11001", '$k0': "11010", '$k1': "11011",
    '$gp': "11100", '$sp': "11101", '$fp': "11110", '$ra': "11111"
};

function parse(ins: Array): string {
    let res = "";
    for (let i = 0, len = ins.length; i < len; i++) {
        try {
            res += ('00000000' + op_set[ins[i][0]](ins[i].slice(1, ins[i].length - 1)).toString(16).toUpperCase()).slice(-8);
            res += ",";
        } catch (err) {
            if (err.name === 'TypeError') {
                res = "[Error] Line " + (ins[i][ins[i].length - 1] + 1).toString() + ": no such instruction '" + ins[i][0] + "'"
            } else {
                res = "[Error] Line " + (ins[i][ins[i].length - 1] + 1).toString() + ": " + err.toString();
            }
            break;
        }
    }
    return res;
}

function Add(ops: Array): number {
    if (ops.length !== 3) {
        throw "`add` instruction needs rs, rt, rd";
    }
    let regs = []
    for (let i = 0; i < 3; i++) {
        regs.push(reg[ops[i]]);
        if (regs[i] === undefined) {
            throw "Register '" + ops[i] + "' not exist";
        }
    }
    const op = '000000', sh_amt = '00000', func = '100000';
    // console.log(op + regs[1] + regs[2] + regs[0] + sh_amt + func);
    return parseInt(op + regs[1] + regs[2] + regs[0] + sh_amt + func, 2);
}

module.exports = {
    assemble
}