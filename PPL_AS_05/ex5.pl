/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).




% Signature: sub_list(Sublist, List)/2
% Purpose: All elements in Sublist appear in List in the same order.
% Precondition: List is fully instantiated (queries do not include variables in their second argument).
sub_list([X|Xs], [X|Ys]) :- sub_list(Xs, Ys).
sub_list([X|Xs], [_|Ys]) :- sub_list([X|Xs], Ys).
sub_list([], _).




% Signature: sub_tree(Subtree, Tree)/2
% Purpose: Tree contains Subtree.
sub_tree(Sub_tree, tree(_, Left_tree, _)) :- sub_tree(Sub_tree, Left_tree).
sub_tree(Sub_tree, tree(_, _, Right_tree)) :- sub_tree(Sub_tree, Right_tree).
sub_tree(tree(X,Left_tree,Right_tree), tree(X,Left_tree,Right_tree)).



% Signature: swap_tree(Tree, InversedTree)/2
% Purpose: InversedTree is the ‘mirror’ representation of Tree.
swap_tree(void, void).
swap_tree(tree(Val, Left_tree, Right_tree), tree(Val, SwappedRight, SwappedLeft)) :- swap_tree(Left_tree, SwappedLeft),swap_tree(Right_tree, SwappedRight).

