import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';

// Tool-level composition of the canonical presentation and native navigation.
export function startStarsPresentation(root,shell,{surface='scene',modeNav,actions=[],redraw}={}){
 const release=applyPresentation(root,{surface,redraw});
 const navigation=mountWorkspaceNavigation(shell,{modeNav,actions,label:'恒星实验导航'});
 const disclosure=bindDisclosures(root);
 for(const node of root.querySelectorAll('button'))node.classList.add('al-button');
 for(const node of root.querySelectorAll('label.control'))node.classList.add('al-parameter');
 for(const node of root.querySelectorAll('details'))if(!node.matches('[class*="-modes"],.hr-mode-menu,.hr-compare-menu,.collapse-task-menu'))node.classList.add('al-disclosure');
 return()=>{disclosure();navigation();release();};
}
