// L5-typecheck
// ========================================================
import { equals, map, zipWith } from 'ramda';
import { isAppExp, isBoolExp, isDefineExp, isIfExp, isLetrecExp, isLetExp, isNumExp,
         isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, parseL5Exp, unparse,
         AppExp, BoolExp, DefineExp, Exp, IfExp, LetrecExp, LetExp, NumExp,
         Parsed, PrimOp, ProcExp, Program, StrExp } from "./L5-ast";
import { applyTEnv, makeEmptyTEnv, makeExtendTEnv, TEnv } from "./TEnv";
import { isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeStrTExp, makeVoidTExp,
         parseTE, unparseTExp,
         BoolTExp, NumTExp, StrTExp, TExp, VoidTExp, UnionTExp, isUnionTExp, makeUnionTExp, isAtomicTExp, ProcTExp } from "./TExp";
import { isEmpty, allT, first, rest, NonEmptyList, List, isNonEmptyList } from '../shared/list';
import { Result, makeFailure, bind, makeOk, zipWithResult, mapv,isOk, isFailure } from '../shared/result';
import { parse as p } from "../shared/parser";
import { format } from '../shared/format';

// TODO L51  
const areUnionTExpComponentsEqual = (te1: UnionTExp, te2: UnionTExp, exp: Exp): boolean =>
  te1.components.length !== te2.components.length ? false:
  te1.components.every((comp, index) => isFailure(checkCompatibleType(comp, te2.components[index], exp)) ? false : true);

  
  const compare_two_procs = (te1 : ProcTExp, te2 :ProcTExp) : Result<boolean> => {
    const paramCount1 = te1.paramTEs.length;
    const paramCount2 = te2.paramTEs.length;
    if (paramCount1 === paramCount2) {
      for (let i = 0; i < paramCount1; i++) {
        const paramTE1 = te1.paramTEs[i];
        const paramTE2 = te2.paramTEs[i];
        if (!is_SubType(paramTE2, paramTE1)) {
          return makeFailure(`Incompatible parameter types at position ${i + 1}`);
        }
      }
      if (is_SubType(te1.returnTE, te2.returnTE)) {
        return makeOk(true);
      } else {
        return makeFailure("Incompatible return types");
      }
    } else {
      return makeFailure("Incompatible parameter counts");
    }

  }
  // Purpose: Check that type expressions are compatible
// as part of a fully-annotated type check process of exp.
// Return an error if te1 is not compatible with te2 - true otherwise.
// Exp is only passed for documentation purposes.
// export const checkCompatibleType = (te1: TExp, te2: TExp): Result<boolean> => {
//     const isCompatibleUnion = (t1: UnionTExp, t2: TExp): boolean =>
//       t1.components.some((comp) => isOk(checkCompatibleType(comp, t2)));
  
  export const checkCompatibleType = (te1: TExp, te2: TExp, exp: Exp): Result<boolean> =>
  equals(te1, te2) ? makeOk(true) :
  isUnionTExp(te1) && isUnionTExp(te2) ? areUnionTExpComponentsEqual(te1, te2, exp) ? makeOk(true) : makeFailure("Incompatible type") :
  isUnionTExp(te1) && is_SubType(te1, te2)? makeOk(true) :
  isUnionTExp(te2) && is_SubType(te1, te2)? makeOk(true):
  isProcTExp(te1) && isProcTExp(te2)? compare_two_procs(te1, te2):
   makeFailure("Incompatible types");

  
const is_SubType = (t1: TExp, t2: TExp): boolean =>
  equals(t1, t2) ? true : isUnionTExp(t2) ? t2.components.some((comp) => is_SubType(t1, comp)) : false;

  
  

// Compute the type of L5 AST exps to TE
// ===============================================
// Compute a Typed-L5 AST exp to a Texp on the basis
// of its structure and the annotations it contains.

// Purpose: Compute the type of a concrete fully-typed expression
export const L5typeof = (concreteExp: string): Result<string> =>
    bind(p(concreteExp), (x) =>
        bind(parseL5Exp(x), (e: Exp) => 
            bind(typeofExp(e, makeEmptyTEnv()), unparseTExp)));

// Purpose: Compute the type of an expression
// Traverse the AST and check the type according to the exp type.
// We assume that all variables and procedures have been explicitly typed in the program.
export const typeofExp = (exp: Parsed, tenv: TEnv): Result<TExp> =>
    isNumExp(exp) ? makeOk(typeofNum(exp)) :
    isBoolExp(exp) ? makeOk(typeofBool(exp)) :
    isStrExp(exp) ? makeOk(typeofStr(exp)) :
    isPrimOp(exp) ? typeofPrim(exp) :
    isVarRef(exp) ? applyTEnv(tenv, exp.var) :
    isIfExp(exp) ? typeofIf(exp, tenv) :
    isProcExp(exp) ? typeofProc(exp, tenv) :
    isAppExp(exp) ? typeofApp(exp, tenv) :
    isLetExp(exp) ? typeofLet(exp, tenv) :
    isLetrecExp(exp) ? typeofLetrec(exp, tenv) :
    isDefineExp(exp) ? typeofDefine(exp, tenv) :
    isProgram(exp) ? typeofProgram(exp, tenv) :
    makeFailure(`Unknown type: ${format(exp)}`);

// Purpose: Compute the type of a sequence of expressions
// Check all the exps in a sequence - return type of last.
// Pre-conditions: exps is not empty.
export const typeofExps = (exps: List<Exp>, tenv: TEnv): Result<TExp> =>
    isNonEmptyList<Exp>(exps) ? 
        isEmpty(rest(exps)) ? typeofExp(first(exps), tenv) :
        bind(typeofExp(first(exps), tenv), _ => typeofExps(rest(exps), tenv)) :
    makeFailure(`Unexpected empty list of expressions`);


// a number literal has type num-te
export const typeofNum = (n: NumExp): NumTExp => makeNumTExp();

// a boolean literal has type bool-te
export const typeofBool = (b: BoolExp): BoolTExp => makeBoolTExp();

// a string literal has type str-te
const typeofStr = (s: StrExp): StrTExp => makeStrTExp();

// primitive ops have known proc-te types
const numOpTExp = parseTE('(number * number -> number)');
const numCompTExp = parseTE('(number * number -> boolean)');
const boolOpTExp = parseTE('(boolean * boolean -> boolean)');

// Todo: cons, car, cdr, list
export const typeofPrim = (p: PrimOp): Result<TExp> =>
    (p.op === '+') ? numOpTExp :
    (p.op === '-') ? numOpTExp :
    (p.op === '*') ? numOpTExp :
    (p.op === '/') ? numOpTExp :
    (p.op === 'and') ? boolOpTExp :
    (p.op === 'or') ? boolOpTExp :
    (p.op === '>') ? numCompTExp :
    (p.op === '<') ? numCompTExp :
    (p.op === '=') ? numCompTExp :
    // Important to use a different signature for each op with a TVar to avoid capture
    (p.op === 'number?') ? parseTE('(T -> boolean)') :
    (p.op === 'boolean?') ? parseTE('(T -> boolean)') :
    (p.op === 'string?') ? parseTE('(T -> boolean)') :
    (p.op === 'list?') ? parseTE('(T -> boolean)') :
    (p.op === 'pair?') ? parseTE('(T -> boolean)') :
    (p.op === 'symbol?') ? parseTE('(T -> boolean)') :
    (p.op === 'not') ? parseTE('(boolean -> boolean)') :
    (p.op === 'eq?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'string=?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'display') ? parseTE('(T -> void)') :
    (p.op === 'newline') ? parseTE('(Empty -> void)') :
    makeFailure(`Primitive not yet implemented: ${p.op}`);

// TODO L51
// Purpose: compute the type of an if-exp
// Typing rule:
//   if type<test>(tenv) = boolean
//      type<then>(tenv) = t1
//      type<else>(tenv) = t1
// then type<(if test then else)>(tenv) = t1

export const typeofIf = (ifExp: IfExp, tenv: TEnv): Result<TExp> => {
    return bind(typeofExp(ifExp.test, tenv), (testTE: TExp) =>
      bind(checkCompatibleType(testTE, makeBoolTExp(),ifExp), (_c1) =>
        bind(typeofExp(ifExp.then, tenv), (thenTE: TExp) =>
          bind(typeofExp(ifExp.alt, tenv), (altTE: TExp) =>
            equalTExp(thenTE, altTE)
              ? makeOk(thenTE)
              : makeOk(makeUnion(thenTE, altTE))
          )
        )
      )
    );
  };
  
  
  const equalTExp = (texp1: TExp, texp2: TExp): boolean => {
    if (isAtomicTExp(texp1) && isAtomicTExp(texp2)) {
      return texp1.tag === texp2.tag;
    } else if (isUnionTExp(texp1) && isUnionTExp(texp2)) {
      const texp1Types = texp1.components;
      const texp2Types = texp2.components;
      if (texp1Types.length !== texp2Types.length) {
        return false;
      }
      for (let i = 0; i < texp1Types.length; i++) {
        if (!equalTExp(texp1Types[i], texp2Types[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };
  
  export const makeUnion = (te1: TExp, te2: TExp): UnionTExp => {
    const components: TExp[] = [];
    const addUniqueComponents = (te: TExp) => {
      if (isUnionTExp(te)) {
        for (const param of te.components) {
          addUniqueComponents(param);
        }
      } else {
        if (!components.some((comp) => equals(comp, te))) {
          components.push(te);
        }}};
    addUniqueComponents(te1);
    addUniqueComponents(te2);
    components.sort(compareTExp);
    return makeUnionTExp(components);
  };
  
  const compareTExp = (te1: TExp, te2: TExp): number => {
    const te1_unparsed = unparseTExp(te1);
    const te2_unparsed = unparseTExp(te2);
    if (isOk(te1_unparsed) && isOk(te2_unparsed)) {
      const aStr = te1_unparsed.value;
      const bStr = te2_unparsed.value;
      return aStr.localeCompare(bStr);
    }
    if (isFailure(te1_unparsed))
     return -1;
    if (isFailure(te2_unparsed))
     return 1;

    return 0;
};
  
  
  
  
  
  
  
  
  
  
  
  
//   // Helper function to extract component types from a TExp
//   const extractComponentTypes = (te: TExp): TExp[] => {
//     if (isUnionTExp(te)) {
//       return te.components;
//     } else {
//       return [te];
//     }
//   };
  
//   // Helper function to compare unparsed TExp strings
//   const compareUnparsedTExp = (a: TExp, b: TExp): number => {
//     const aStr = unparseTExp(a);
//     const bStr = unparseTExp(b);
  
//     if (isOk(aStr) && isOk(bStr)) {
//       return aStr.value.localeCompare(bStr.value);
//     } else {
//       // Handle failure case
//       return 0; // or return a default comparison value if needed
//     }
//   };
  
  

// Purpose: compute the type of a proc-exp
// Typing rule:
// If   type<body>(extend-tenv(x1=t1,...,xn=tn; tenv)) = t
// then type<lambda (x1:t1,...,xn:tn) : t exp)>(tenv) = (t1 * ... * tn -> t)
export const typeofProc = (proc: ProcExp, tenv: TEnv): Result<TExp> => {
    const argsTEs = map((vd) => vd.texp, proc.args);
    const extTEnv = makeExtendTEnv(map((vd) => vd.var, proc.args), argsTEs, tenv);
    const constraint1 = bind(typeofExps(proc.body, extTEnv), (body: TExp) => 
                            checkCompatibleType(body, proc.returnTE, proc));
    return bind(constraint1, _ => makeOk(makeProcTExp(argsTEs, proc.returnTE)));
};

// Purpose: compute the type of an app-exp
// Typing rule:
// If   type<rator>(tenv) = (t1*..*tn -> t)
//      type<rand1>(tenv) = t1
//      ...
//      type<randn>(tenv) = tn
// then type<(rator rand1...randn)>(tenv) = t
// We also check the correct number of arguments is passed.
export const typeofApp = (app: AppExp, tenv: TEnv): Result<TExp> =>
    bind(typeofExp(app.rator, tenv), (ratorTE: TExp) => {
        if (! isProcTExp(ratorTE)) {
            return bind(unparseTExp(ratorTE), (rator: string) =>
                        bind(unparse(app), (exp: string) =>
                            makeFailure<TExp>(`Application of non-procedure: ${rator} in ${exp}`)));
        }
        if (app.rands.length !== ratorTE.paramTEs.length) {
            return bind(unparse(app), (exp: string) => makeFailure<TExp>(`Wrong parameter numbers passed to proc: ${exp}`));
        }
        const constraints = zipWithResult((rand, trand) => bind(typeofExp(rand, tenv), (typeOfRand: TExp) => 
                                                                checkCompatibleType(typeOfRand, trand, app)),
                                          app.rands, ratorTE.paramTEs);
        return bind(constraints, _ => makeOk(ratorTE.returnTE));
    });

// Purpose: compute the type of a let-exp
// Typing rule:
// If   type<val1>(tenv) = t1
//      ...
//      type<valn>(tenv) = tn
//      type<body>(extend-tenv(var1=t1,..,varn=tn; tenv)) = t
// then type<let ((var1 val1) .. (varn valn)) body>(tenv) = t
export const typeofLet = (exp: LetExp, tenv: TEnv): Result<TExp> => {
    const vars = map((b) => b.var.var, exp.bindings);
    const vals = map((b) => b.val, exp.bindings);
    const varTEs = map((b) => b.var.texp, exp.bindings);
    const constraints = zipWithResult((varTE, val) => bind(typeofExp(val, tenv), (typeOfVal: TExp) => 
                                                            checkCompatibleType(varTE, typeOfVal, exp)),
                                      varTEs, vals);
    return bind(constraints, _ => typeofExps(exp.body, makeExtendTEnv(vars, varTEs, tenv)));
};

// Purpose: compute the type of a letrec-exp
// We make the same assumption as in L4 that letrec only binds proc values.
// Typing rule:
//   (letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)
//   tenv-body = extend-tenv(p1=(t11*..*t1n1->t1)....; tenv)
//   tenvi = extend-tenv(xi1=ti1,..,xini=tini; tenv-body)
// If   type<body1>(tenv1) = t1
//      ...
//      type<bodyn>(tenvn) = tn
//      type<body>(tenv-body) = t
// then type<(letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)>(tenv-body) = t
export const typeofLetrec = (exp: LetrecExp, tenv: TEnv): Result<TExp> => {
    const ps = map((b) => b.var.var, exp.bindings);
    const procs = map((b) => b.val, exp.bindings);
    if (! allT(isProcExp, procs))
        return makeFailure(`letrec - only support binding of procedures - ${format(exp)}`);
    const paramss = map((p) => p.args, procs);
    const bodies = map((p) => p.body, procs);
    const tijs = map((params) => map((p) => p.texp, params), paramss);
    const tis = map((proc) => proc.returnTE, procs);
    const tenvBody = makeExtendTEnv(ps, zipWith((tij, ti) => makeProcTExp(tij, ti), tijs, tis), tenv);
    const tenvIs = zipWith((params, tij) => makeExtendTEnv(map((p) => p.var, params), tij, tenvBody),
                           paramss, tijs);
    const types = zipWithResult((bodyI, tenvI) => typeofExps(bodyI, tenvI), bodies, tenvIs)
    const constraints = bind(types, (types: TExp[]) => 
                            zipWithResult((typeI, ti) => checkCompatibleType(typeI, ti, exp), types, tis));
    return bind(constraints, _ => typeofExps(exp.body, tenvBody));
};

// Typecheck a full program
// TODO L51
// TODO: Thread the TEnv (as in L1)

// Purpose: compute the type of a define
// Typing rule:
//   (define (var : texp) val)
// TODO L51 - write the true definition
export const typeofDefine = (exp: DefineExp, tenv: TEnv): Result<VoidTExp> =>{
    const value = exp.val;
    const Texp = exp.var.texp;
    const va = exp.var.var;
    const t = makeExtendTEnv([va], [Texp], tenv);
    const constraint = typeofExp(value, t);    
    return mapv(constraint, (_) => makeVoidTExp());
};

// Purpose: compute the type of a program
// Typing rule:
export const typeofProgram = (exp: Program, tenv: TEnv): Result<TExp> =>
    typeofExps(exp.exps, tenv);
