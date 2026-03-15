import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
    try {
        const githubToken: string = core.getInput('github_token')
        const ref = github.context.ref.replace('refs/heads/', '')
        const gh = github.getOctokit(githubToken)
        const repo = github.context.repo
        const openPRs = await gh.rest.pulls.list({
            owner: repo.owner,
            repo: repo.repo,
            state: 'open',
            head: ref
        })

        core.info(`Building on ${ref}`)
        if (github.context.eventName !== 'push') {
            core.info('Not a push event. Continuing with build.')
            core.setOutput('abort', false)
            return
        }

        if (github.context.eventName === 'push' && ref === 'main') {
            core.info(
                'Push event on main branch detected. Continuing with build.'
            )
            core.setOutput('abort', false)
            return
        }

        if (openPRs.data.length === 0) {
            core.info(
                'No relevant open pull requests found. Continuing with build.'
            )
            core.setOutput('abort', false)
            return
        }

        openPRs.data.forEach((pr) => {
            core.info(
                `Ignoring PR ${pr.number} - ${pr.title} because it is on ${ref} rather than head ${pr.head.ref}`
            )
            if (ref === pr.head.ref) {
                core.info(
                    `Found open PR ${pr.number}: '${pr.title}' with head ${ref}. Debouncing this push build.`
                )
            }
        })
        core.setOutput('abort', true)
    } catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error))
    }
}
