import { map } from "ramda";
import { Exp, Program, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isProcExp, isIfExp, isAppExp, isDefineExp, PrimOp, CExp } from '../imp/L3-ast';
import { Result, makeFailure, makeOk, bind, mapResult, safe2 } from '../shared/result';

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => isProgram(exp) ? bind(mapResult(l2ToPython, exp.exps), exps => makeOk(exps.join("\n"))) 
: isNumExp(exp) ? makeOk(exp.val.toString()) 
: isVarRef(exp) ? makeOk(exp.var) 
: isPrimOp(exp) ? makeOk(operator_to_python(exp.op)) : 
isProcExp(exp) ? bind(l2ToPython(exp.body[exp.body.length-1]), body => makeOk("(" + "lambda " +  map((p) => p.var, exp.args).join(",") + " : " + body + ")")) : isBoolExp(exp) ? makeOk(exp.val ? 'True' : 'False') :
 isAppExp(exp) ? ( isPrimOp(exp.rator) ? compoundEXP_to_pythonEXP(exp.rator, exp.rands) : safe2((rator: string, rands: string[]) => makeOk(`${rator}(${rands.join(",")})`)) (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands)))
  : isIfExp(exp) ? bind(l2ToPython(exp.test), test => bind(l2ToPython(exp.then), then => bind(l2ToPython(exp.alt), alt => makeOk(`(${then} if ${test} else ${alt})`)))): isDefineExp(exp) ? bind(l2ToPython(exp.val), val => makeOk(`${exp.var.var} = ${val}`)) : makeFailure("ERROR");

/*translate primative to python support */
const operator_to_python = (operator : string) : string => operator === "=" || operator === "eq?" ? "==" : operator === "number?" ? "(lambda x : type(x) == int or type(x) == float)" : operator === "boolean?" ? "(lambda x : type(x) == bool)" : operator;

/*translate compound exp to pyhton exp */
const compoundEXP_to_pythonEXP = (rator : PrimOp, rands : CExp[]) : Result<string> => rator.op === "not" ? bind(l2ToPython(rands[0]), (rand : string) => makeOk("(not " + rand + ")")) 
: rator.op === "number?" || rator.op === "boolean?" ? bind(l2ToPython(rands[0]), (rand : string) => makeOk(`${operator_to_python(rator.op)}(${rands[0]})`))
 : bind(mapResult(l2ToPython,rands), (rands) => makeOk("("+rands.join(" "+operator_to_python(rator.op)+" ") + ")"));