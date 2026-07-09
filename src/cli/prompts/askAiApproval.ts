import { note } from '@clack/prompts'
import pc from 'picocolors'

import type { AiRewriteChoice } from '../../ai/aiTypes.js'
import { askSelect, askText } from './prompt.js'

export interface AiApprovalResult {
    choice: AiRewriteChoice
    editedText?: string
}

/**
 * Presents one AI suggestion for explicit approval. AI text is never applied
 * automatically: the user must accept it, edit it, retry, or keep the original.
 */
export const askAiApproval = async (original: string, suggestion: string): Promise<AiApprovalResult> => {
    note(`${pc.dim('Original')}\n${original}\n\n${pc.dim('AI suggestion')}\n${suggestion}`, 'Review wording')

    const choice = await askSelect<AiRewriteChoice>(
        'Use this version?',
        [
            { label: 'Accept suggestion', value: 'accept' },
            { label: 'Edit manually', value: 'edit' },
            { label: 'Retry', value: 'retry' },
            { label: 'Keep original', value: 'reject' },
        ],
        'accept',
    )

    if (choice === 'edit') {
        const editedText = await askText({ message: 'Your wording', initialValue: suggestion })
        return { choice, editedText }
    }

    return { choice }
}
