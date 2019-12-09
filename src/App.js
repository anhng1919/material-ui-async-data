import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import produce from "immer";
import CircularProgress from "@material-ui/core/CircularProgress";
import FolderIcon from "@material-ui/icons/Folder";
import DescriptionIcon from "@material-ui/icons/Description";
import {StyledTreeItem} from "./StyledTreeItem";
import {getChildrenApi} from "./api";


const reducer = (state, action) => {
  switch (action.type) {
    case "APPEND_NODES":
      return produce(state, draftState => {
        if (action.nodes.length === 0) {
          const parentNode = getNode(draftState, action.parentNodeId);
          if (parentNode) {
            parentNode.noChildren = true;
          }
        }
        for (let node of action.nodes) {
          if (!getNode(state, node.id)) {
            draftState.push(node);
          }
        }
      });
    default:
      throw new Error("Invalid action " + action.type);
  }
};

const getNode = (data, nodeId) => data.find(node => node.id === nodeId);

const getNodeChildren = (data, nodeId) =>
  data.filter(node => node.parentId === nodeId);

const generateTree = (data, nodeId) => {
  const node = getNode(data, nodeId);

  let children = getNodeChildren(data, nodeId).map(node =>
    generateTree(data, node.id)
  );

  if (node) {
    if (node.type === "folder" && children.length === 0 && !node.noChildren) {
      children = [
        <StyledTreeItem
          key="-"
          nodeId="-"
          labelText="Loading..."
          labelIcon={CircularProgress}
        />
      ];
    }
    return (
      <StyledTreeItem
        key={node.id}
        nodeId={node.id}
        labelText={node.name}
        labelIcon={node.type === "folder" ? FolderIcon : DescriptionIcon}
      >
        {children}
      </StyledTreeItem>
    );
  } else {
    return [children];
  }
};

const useStyles = makeStyles({
  root: {
    flexGrow: 1
  }
});

export const App = (props) => {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState([]);
  const [data, dispatch] = React.useReducer(reducer, []);

  const handleChange = async (event, nodes) => {
    const expandingNodes = nodes.filter(x => !expanded.includes(x));

    setExpanded(nodes);

    if (expandingNodes[0]) {
      const nodes = await getChildrenApi(expandingNodes[0]);
      dispatch({
        type: "APPEND_NODES",
        parentNodeId: expandingNodes[0],
        nodes
      });
    }
  };

  React.useEffect(() => {
    getChildrenApi("0").then(nodes => {
      dispatch({
        type: "APPEND_NODES",
        parentNodeId: "0",
        nodes
      });
    });
  }, []);

  return (
    <>
      <TreeView
        className={classes.root}
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 24 }} />}
        expanded={expanded}
        onNodeToggle={handleChange}
      >
        {generateTree(data, "0")}
      </TreeView>
    </>
  );
}
