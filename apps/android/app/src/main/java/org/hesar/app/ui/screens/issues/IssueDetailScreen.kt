package org.hesar.app.ui.screens.issues

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.hesar.app.R
import org.hesar.app.data.repository.IssueRepository
import org.hesar.app.domain.gate.MutationCapabilityGate
import org.hesar.app.domain.model.Comment
import org.hesar.app.domain.model.ConnectivityState
import org.hesar.app.domain.model.Issue
import org.hesar.app.domain.model.MutationCapability
import org.hesar.app.ui.common.OfflineBanner
import org.hesar.app.util.JalaliDateHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IssueDetailScreen(
    issueId: String,
    workspaceSlug: String,
    projectId: String,
    issueRepository: IssueRepository,
    capabilityGate: MutationCapabilityGate,
    connectivityState: ConnectivityState,
    onBack: () -> Unit
) {
    val issue by issueRepository.getIssueDetailFlow(issueId).collectAsState(initial = null)
    val comments by issueRepository.getCommentsFlow(issueId).collectAsState(initial = emptyList())
    val capability by capabilityGate.observeCapability().collectAsState(initial = capabilityGate.getCapability())

    val scope = rememberCoroutineScope()
    var commentText by remember { mutableStateOf("") }
    var isPostingComment by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = issue?.displayKey ?: "",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "بازگشت"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            OfflineBanner(
                connectivityState = connectivityState,
                lastSyncedAt = issue?.lastSyncedAt
            )

            if (issue == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.offline_issue_not_cached),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 16.dp)
                ) {
                    item {
                        Spacer(modifier = Modifier.height(12.dp))

                        // Title
                        Text(
                            text = issue!!.name,
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.onBackground
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Status and Priority Badges
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // State
                            val stateColor = parseHexColor(issue!!.stateColor) ?: MaterialTheme.colorScheme.primary
                            Box(
                                modifier = Modifier
                                    .background(stateColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = issue!!.stateName ?: "نامشخص",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = stateColor,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            // Priority
                            Box(
                                modifier = Modifier
                                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "اولویت: ${issue!!.priority.faLabel}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Offline notice on edit controls
                        if (!capability.isMutationAllowed) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "آفلاین — امکان ویرایش وجود ندارد",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFB45309)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Dates in Jalali
                        if (issue!!.targetDate != null) {
                            Text(
                                text = "سررسید: ${JalaliDateHelper.formatIsoToJalali(issue!!.targetDate)}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }

                        Text(
                            text = "ایجاد شده: ${JalaliDateHelper.formatIsoToJalali(issue!!.createdAt)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(20.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(16.dp))

                        // Comments Header
                        Text(
                            text = stringResource(R.string.comments) + " (${comments.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // Comments List
                    items(comments, key = { it.id }) { comment ->
                        CommentItem(comment = comment)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                // Comment Composer (Disabled when offline!)
                Divider()
                CommentComposer(
                    text = commentText,
                    onTextChange = { commentText = it },
                    isEnabled = capability.isMutationAllowed,
                    isPosting = isPostingComment,
                    onSend = {
                        if (commentText.isNotBlank() && capability.isMutationAllowed) {
                            isPostingComment = true
                            scope.launch {
                                issueRepository.addComment(
                                    workspaceSlug = workspaceSlug,
                                    projectId = projectId,
                                    issueId = issueId,
                                    commentHtml = "<p>$commentText</p>"
                                )
                                commentText = ""
                                isPostingComment = false
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun CommentItem(comment: Comment) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = comment.actorName.ifBlank { "کاربر" },
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = JalaliDateHelper.formatIsoToJalali(comment.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = comment.commentHtml.replace(Regex("<[^>]*>"), ""),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
fun CommentComposer(
    text: String,
    onTextChange: (String) -> Unit,
    isEnabled: Boolean,
    isPosting: Boolean,
    onSend: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
    ) {
        if (!isEnabled) {
            Text(
                text = "دیدگاه‌ها در حالت آفلاین فقط خواندنی هستند.",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFB45309),
                modifier = Modifier.padding(bottom = 6.dp)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = text,
                onValueChange = onTextChange,
                placeholder = {
                    Text(
                        if (isEnabled) stringResource(R.string.comment_composer_hint)
                        else "ارسال دیدگاه غیرفعال است (آفلاین)"
                    )
                },
                enabled = isEnabled,
                modifier = Modifier.weight(1f),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))

            IconButton(
                onClick = onSend,
                enabled = isEnabled && text.isNotBlank() && !isPosting
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = stringResource(R.string.post_comment),
                    tint = if (isEnabled && text.isNotBlank()) MaterialTheme.colorScheme.primary else Color.Gray
                )
            }
        }
    }
}
