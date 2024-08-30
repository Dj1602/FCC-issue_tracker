'use strict';


const ProjectModel = require('../Models').Project;
const IssueModel = require('../Models').Issue;


module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(async (req, res) => {
      let project = req.params.project;
      const projectName = await ProjectModel.findOne({ name: project });
      if (!projectName) {
        res.json({ error: "Project not found" });
        return;
      } else {
        let filteredItems = [];
        const isSame = (filteredObj, toBeChecked) =>
          Object.keys(filteredObj).find(prop => filteredObj[prop] != toBeChecked[prop]) == null;
        filteredItems = projectName.issues.filter(item => isSame(req.query, item))
        res.json(filteredItems)
      }
    })

    .post(async function (req, res) {
      let projectName = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
      } = req.body;
      if (!issue_title || !issue_text || !created_by) {
        res.json({ error: "required field(s) missing" });
        return;
      }
      try {
        let projectModel = await ProjectModel.findOne({ name: projectName });
        if (!projectModel) {
          projectModel = new ProjectModel({ name: projectName });
          projectModel = await projectModel.save();
        }
        const issueModel = new IssueModel({
          issue_title: issue_title || "",
          issue_text: issue_text || "",
          created_on: new Date(),
          updated_on: new Date(),
          created_by: created_by || "",
          assigned_to: assigned_to || "",
          open: true,
          status_text: status_text || ""
        });
        projectModel.issues.push(issueModel)
        projectModel.save()
        res.json(issueModel);
      } catch (err) {
        res.json({ error: "Could not post" })
      }
    })

    .put(async (req, res) => {
      let project = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body;
      if (!_id) {
        res.json({ error: 'missing _id' });
        return;
      }
      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        !open
      ) {
        res.json({ error: 'no update field(s) sent', '_id': _id });
        return;
      }

      ProjectModel.findOne({ name: project }, (err, projectData) => {
        if(err || !projectData) {
          res.json({ error: "could not update", _id: _id });
        } else {
          const thisIssue = projectData.issues.id(_id);
          if(!thisIssue) {
            res.json({ error: "could not update", _id: _id });
            return;
          }
          thisIssue.issue_title = issue_title || thisIssue.issue_title;
          thisIssue.issue_text = issue_text || thisIssue.issue_text;
          thisIssue.created_by = created_by || thisIssue.created_by;
          thisIssue.assigned_to = assigned_to || thisIssue.assigned_to;
          thisIssue.open = open || thisIssue.open;
          thisIssue.status_text = status_text || thisIssue.status_text;
          thisIssue.updated_on = new Date();
          projectData.save((err, data) => {
            if (err || !data) {
              res.json({ error: "could not update", _id: _id });
            } else {
              res.json({ result: "successfully updated", '_id': _id });
            }
          })
        }
      })
    })

    .delete(async function (req, res) {
      let projectName = req.params.project;
      const { _id } = req.body;
      if (!_id) {
        res.json({ error: 'missing _id' });
        return;
      }
      ProjectModel.findOne({ name: projectName }, (err, projectData) => {
        if(err || !projectData) {
          res.json({ error: "could not delete", _id: _id });
        } else {
          const thisIssue = projectData.issues.id(_id);
          if(!thisIssue) {
            res.json({ error: "could not delete", _id: _id });
            return;
          }
          thisIssue.remove();
          projectData.save((err, data) => {
            if(err || !data) {
              res.json({ error: 'could not delete', '_id': _id });
            } else {
              res.json({ result: 'successfully deleted', '_id': _id }); 
            }
          })
        }
      })
    });
};
