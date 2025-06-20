use serde::Serialize;
use serde_json::json;

#[derive(Serialize)]
struct FileStatus {
    status: String,
    path: String,
}

#[derive(Serialize)]
struct CommitHistory {
    id: String,
    author: String,
    date: String,
    message: String,
}

#[tauri::command]
pub fn git_status(local_path: String) -> Result<serde_json::Value, String> {
    let repo = git2::Repository::open(&local_path).map_err(|e| e.message().to_string())?;
    let mut status_opts = git2::StatusOptions::new();
    status_opts
        .include_untracked(true)
        .include_unmodified(false)
        .include_ignored(false);

    let statuses = repo.statuses(Some(&mut status_opts)).map_err(|e| e.message().to_string())?;

    let mut file_statuses = Vec::new();
    for entry in statuses.iter() {
        let status = entry.status();
        let path = entry.path().unwrap_or("[unknown]").to_string();

        let status_symbol = if status.contains(git2::Status::WT_NEW) {
            "?"
        } else if status.contains(git2::Status::WT_MODIFIED) {
            "M"
        } else if status.contains(git2::Status::WT_DELETED) {
            "D"
        } else if status.contains(git2::Status::WT_TYPECHANGE) {
            "T"
        } else if status.contains(git2::Status::WT_RENAMED) {
            "R"
        } else if status.contains(git2::Status::INDEX_NEW) {
            "A"
        } else if status.contains(git2::Status::INDEX_MODIFIED) {
            "M"
        } else if status.contains(git2::Status::INDEX_DELETED) {
            "D"
        } else {
            ""
        };

        file_statuses.push(FileStatus {
            status: status_symbol.to_string(),
            path,
        });
    }

    if file_statuses.is_empty() {
        Ok(json!({ "message": "No changes" }))
    } else {
        Ok(json!({ "files": file_statuses }))
    }
}

#[tauri::command]
pub fn git_add(local_path: String) -> Result<serde_json::Value, String> {
    let repo = git2::Repository::open(&local_path).map_err(|e| e.message().to_string())?;
    let mut index = repo.index().map_err(|e| e.message().to_string())?;

    let mut status_opts = git2::StatusOptions::new();
    status_opts
        .include_untracked(true)
        .include_unmodified(false)
        .include_ignored(false);

    let statuses = repo.statuses(Some(&mut status_opts)).map_err(|e| e.message().to_string())?;

    let mut added_files = Vec::new();
    for entry in statuses.iter() {
        let status = entry.status();
        if status.contains(git2::Status::WT_NEW) ||
            status.contains(git2::Status::WT_MODIFIED) ||
            status.contains(git2::Status::WT_TYPECHANGE) ||
            status.contains(git2::Status::WT_RENAMED)
        {
            if let Some(path) = entry.path() {
                index.add_path(std::path::Path::new(path)).map_err(|e| e.message().to_string())?;
                added_files.push(path.to_string());
            }
        }
    }

    index.write().map_err(|e| e.message().to_string())?;

    if added_files.is_empty() {
        Ok(json!({ "message": "No files added" }))
    } else {
        Ok(json!({ "added_files": added_files }))
    }
}

#[tauri::command]
pub fn git_commit_changes(local_path: String, message: String) -> Result<serde_json::Value, String> {
    // 检查是否有未提交的变更
    let has_changes = {
        let repo = git2::Repository::open(&local_path).map_err(|e| e.message().to_string())?;
        let mut status_opts = git2::StatusOptions::new();
        status_opts
            .include_untracked(true)
            .include_unmodified(false)
            .include_ignored(false);

        let statuses = repo.statuses(Some(&mut status_opts)).map_err(|e| e.message().to_string())?;

        // 检查是否有任何变更（包括未跟踪、修改、删除等）
        statuses.iter().any(|entry| {
            let s = entry.status();
            s.is_wt_new() ||
                s.is_wt_modified() ||
                s.is_wt_deleted() ||
                s.is_wt_renamed() ||
                s.is_wt_typechange() ||
                s.is_index_new() ||
                s.is_index_modified() ||
                s.is_index_deleted()
        })
    };

    if has_changes {
        // 如果有变更，先添加所有变更
        git_add(local_path.clone())?;

        // 然后执行提交
        git_commit(local_path, message)
    } else {
        // 没有变更时返回消息
        Ok(json!({ "message": "No changes to commit" }))
    }
}

#[tauri::command]
pub fn git_commit(local_path: String, message: String) -> Result<serde_json::Value, String> {
    let repo = git2::Repository::open(&local_path).map_err(|e| e.message().to_string())?;
    let mut index = repo.index().map_err(|e| e.message().to_string())?;
    let tree_oid = index.write_tree().map_err(|e| e.message().to_string())?;
    let tree = repo.find_tree(tree_oid).map_err(|e| e.message().to_string())?;

    let parent_commit = match repo.head() {
        Ok(head_ref) => Some(head_ref.peel_to_commit().map_err(|e| e.message().to_string())?),
        Err(_) => None,
    };

    let signature = repo.signature().map_err(|e| e.message().to_string())?;

    let commit_id = repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        &message,
        &tree,
        &parent_commit
            .as_ref()
            .map(|c| c)
            .into_iter()
            .collect::<Vec<_>>(),
    ).map_err(|e| e.message().to_string())?;

    let commit = repo.find_commit(commit_id).map_err(|e| e.message().to_string())?;

    Ok(json!({
        "id": commit.id().to_string(),
        "author": {
            "name": signature.name().unwrap_or("Unknown"),
            "email": signature.email().unwrap_or("")
        },
        "message": message,
        "timestamp": signature.when().seconds()
    }))
}

#[tauri::command]
pub fn git_history(local_path: String, file_path: String) -> Result<serde_json::Value, String> {
    let repo = git2::Repository::open(&local_path).map_err(|e| e.message().to_string())?;
    let workdir = repo.workdir().ok_or("Repository has no working directory")?;
    let abs_path = workdir.join(&file_path);

    let repo_path = abs_path.strip_prefix(workdir)
        .map_err(|_| "Invalid file path".to_string())?
        .to_str()
        .ok_or("Invalid UTF-8 path")?;

    let mut revwalk = repo.revwalk().map_err(|e| e.message().to_string())?;
    revwalk.push_head().map_err(|e| e.message().to_string())?;
    revwalk.set_sorting(git2::Sort::TIME).map_err(|e| e.message().to_string())?;

    let mut history = Vec::new();
    let mut count = 0;
    const MAX_COMMITS: usize = 100;

    for commit_id in revwalk {
        let commit_id = commit_id.map_err(|e| e.message().to_string())?;
        let commit = repo.find_commit(commit_id).map_err(|e| e.message().to_string())?;

        if commit.parent_count() > 0 {
            let parent = commit.parent(0).map_err(|e| e.message().to_string())?;
            let parent_tree = parent.tree().map_err(|e| e.message().to_string())?;
            let commit_tree = commit.tree().map_err(|e| e.message().to_string())?;

            let diff = repo.diff_tree_to_tree(
                Some(&parent_tree),
                Some(&commit_tree),
                None
            ).map_err(|e| e.message().to_string())?;

            let found = diff.deltas()
                .any(|delta| {
                    if let Some(path) = delta.new_file().path() {
                        path.to_string_lossy() == repo_path
                    } else {
                        false
                    }
                });

            if !found {
                continue;
            }
        }

        let author = commit.author();
        let timestamp = author.when().seconds();
        let date = chrono::DateTime::from_timestamp(timestamp, 0)
            .ok_or("Invalid timestamp")?
            .format("%Y-%m-%d %H:%M:%S").to_string();

        history.push(CommitHistory {
            id: commit.id().to_string()[..7].to_string(),
            author: author.name().unwrap_or("Unknown").to_string(),
            date,
            message: commit.message().unwrap_or("").trim().to_string(),
        });

        count += 1;
        if count >= MAX_COMMITS {
            break;
        }
    }

    if history.is_empty() {
        Ok(json!({ "message": "No history found" }))
    } else {
        Ok(json!({ "commits": history }))
    }
}